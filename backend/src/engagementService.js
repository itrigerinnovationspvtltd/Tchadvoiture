import { Enquiry, Notification, Report, User, Vehicle, Wishlist } from './models.js';
import { httpError, pageQuery, paged, vehicleTitle } from './lib.js';
import { toEnquiry, toNotification, toVehicle } from './serializers.js';

export async function notify(userId, payload) {
  await Notification.create({ user: userId, ...payload });
}

export async function createEnquiry(buyer, { vehicleId, message }) {
  const text = String(message || '').trim();
  if (text.length < 5) throw httpError(400, 'Write a short message for the seller.');
  const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'active' });
  if (!vehicle) throw httpError(404, 'Listing not found.');
  const seller = await User.findById(vehicle.seller);
  if (!seller || seller.status !== 'active') throw httpError(400, 'This seller is not available.');
  if (String(seller._id) === String(buyer._id)) throw httpError(400, 'You cannot enquire on your own listing.');
  const enquiry = await Enquiry.create({
    vehicle: vehicle._id,
    seller: seller._id,
    buyer: buyer._id,
    buyerName: buyer.name,
    buyerPhone: buyer.phone,
    buyerEmail: buyer.email,
    message: text.slice(0, 2000),
    vehicleTitle: vehicleTitle(vehicle),
    status: 'new',
  });
  await notify(seller._id, {
    type: 'enquiry',
    title: 'New enquiry',
    body: `${buyer.name} asked about ${enquiry.vehicleTitle}.`,
    link: '/enquiries',
  });
  return toEnquiry(enquiry);
}

export async function listEnquiries(user, box) {
  const wanted = box === 'sent' ? 'sent' : 'inbox';
  if (wanted === 'inbox' && user.role === 'buyer') return [];
  const filter = wanted === 'sent' ? { buyer: user._id } : { seller: user._id };
  const rows = await Enquiry.find(filter).sort({ createdAt: -1 });
  return rows.map(toEnquiry);
}

export async function updateEnquiryStatus(user, id, status) {
  if (!['new', 'read', 'closed'].includes(status)) throw httpError(400, 'Choose a valid enquiry status.');
  const enquiry = await Enquiry.findOne({ _id: id, seller: user._id });
  if (!enquiry) throw httpError(404, 'Enquiry not found.');
  enquiry.status = status;
  await enquiry.save();
  if (status === 'read' || status === 'closed') {
    await notify(enquiry.buyer, {
      type: 'enquiry_update',
      title: 'Enquiry update',
      body: `Your enquiry about ${enquiry.vehicleTitle} was marked ${status}.`,
      link: `/cars/${enquiry.vehicle}`,
    });
  }
  return toEnquiry(enquiry);
}

export async function listWishlist(user) {
  const rows = await Wishlist.find({ user: user._id }).sort({ createdAt: -1 });
  const vehicles = await Vehicle.find({ _id: { $in: rows.map((row) => row.vehicle) }, status: { $ne: 'removed' } }).populate(
    'seller',
    'name role location avatarUrl logoUrl dealershipName description address businessDetails status',
  );
  const byId = new Map(vehicles.map((vehicle) => [String(vehicle._id), vehicle]));
  return rows
    .map((row) => byId.get(String(row.vehicle)))
    .filter(Boolean)
    .map((vehicle) => toVehicle(vehicle, { favourited: true, owner: String(vehicle.seller?._id || vehicle.seller) === String(user._id) }));
}

export async function addWishlist(user, vehicleId) {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'active' });
  if (!vehicle) throw httpError(404, 'Listing not found.');
  await Wishlist.updateOne({ user: user._id, vehicle: vehicle._id }, { user: user._id, vehicle: vehicle._id }, { upsert: true });
  return { favourited: true };
}

export async function removeWishlist(user, vehicleId) {
  await Wishlist.deleteOne({ user: user._id, vehicle: vehicleId });
  return { favourited: false };
}

export async function createReport(user, { vehicleId, reason }) {
  const text = String(reason || '').trim();
  if (text.length < 10) throw httpError(400, 'Describe the problem in at least 10 characters.');
  const vehicle = await Vehicle.findOne({ _id: vehicleId, status: { $nin: ['removed'] } });
  if (!vehicle || vehicle.status !== 'active') throw httpError(404, 'Listing not found.');
  if (String(vehicle.seller) === String(user._id)) throw httpError(400, 'You cannot report your own listing.');
  const existing = await Report.findOne({ vehicle: vehicle._id, reporter: user._id, status: 'open' });
  if (existing) throw httpError(409, 'You already reported this listing.');
  const report = await Report.create({
    vehicle: vehicle._id,
    reporter: user._id,
    reason: text.slice(0, 1000),
    vehicleTitle: vehicleTitle(vehicle),
  });
  return { id: String(report._id), status: report.status };
}

export async function listNotifications(user, req) {
  const { page, limit, skip } = pageQuery(req, 20);
  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ user: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: user._id }),
    Notification.countDocuments({ user: user._id, readAt: null }),
  ]);
  return { ...paged(items.map(toNotification), total, page, limit), unreadCount };
}

export async function notificationSummary(user) {
  const unreadCount = await Notification.countDocuments({ user: user._id, readAt: null });
  return { unreadCount };
}

export async function markNotificationRead(user, id) {
  const item = await Notification.findOne({ _id: id, user: user._id });
  if (!item) throw httpError(404, 'Notification not found.');
  if (!item.readAt) {
    item.readAt = new Date();
    await item.save();
  }
  return toNotification(item);
}

export async function markAllNotificationsRead(user) {
  await Notification.updateMany({ user: user._id, readAt: null }, { readAt: new Date() });
}
