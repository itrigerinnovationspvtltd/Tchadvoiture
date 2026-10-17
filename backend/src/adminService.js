import { Activity, Announcement, Enquiry, Lookup, Make, Model, Page, Report, Setting, User, Vehicle } from './models.js';
import { escapeRegex, httpError, pageQuery, paged, vehicleTitle } from './lib.js';
import { toAuthUser } from './authService.js';
import { notify } from './engagementService.js';
import { removeUpload } from './authService.js';
import { resolveVehicleFields } from './vehicleService.js';
import { toEnquiry, toVehicle } from './serializers.js';

const SELLER_FIELDS = 'name email phone role location avatarUrl logoUrl dealershipName description address businessDetails status';

async function logActivity(admin, action, message) {
  await Activity.create({ actorId: admin._id, actorName: admin.name, action, message });
}

export async function dashboard() {
  const [totalUsers, totalDealers, totalIndividuals, totalListings, activeListings, pendingListings, soldListings, inactiveListings, totalEnquiries, recentUsers, recentListings, recentActivity] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'dealer' }),
      User.countDocuments({ role: 'individual' }),
      Vehicle.countDocuments({ status: { $ne: 'removed' } }),
      Vehicle.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'pending' }),
      Vehicle.countDocuments({ status: 'sold' }),
      Vehicle.countDocuments({ status: 'inactive' }),
      Enquiry.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(6),
      Vehicle.find({ status: { $ne: 'removed' } }).sort({ createdAt: -1 }).limit(6),
      Activity.find().sort({ createdAt: -1 }).limit(8),
    ]);

  return {
    totalUsers,
    totalDealers,
    totalIndividuals,
    totalListings,
    activeListings,
    pendingListings,
    soldListings,
    inactiveListings,
    soldOrInactive: soldListings + inactiveListings,
    totalEnquiries,
    recentUsers: recentUsers.map(toAuthUser),
    recentListings: recentListings.map((vehicle) => ({
      id: String(vehicle._id),
      title: vehicleTitle(vehicle),
      status: vehicle.status,
      price: vehicle.price,
      createdAt: vehicle.createdAt,
    })),
    recentActivity: recentActivity.map((item) => ({
      id: String(item._id),
      action: item.action,
      message: item.message,
      createdAt: item.createdAt,
    })),
  };
}

export async function listUsers(req) {
  const { page, limit, skip } = pageQuery(req, 20);
  const filter = {};
  if (['buyer', 'individual', 'dealer'].includes(req.query.role)) filter.role = req.query.role;
  if (['active', 'inactive', 'blocked'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { dealershipName: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return paged(items.map(toAuthUser), total, page, limit);
}

export async function getUser(id) {
  const user = await User.findById(id);
  if (!user) throw httpError(404, 'User not found.');
  const [vehicles, enquiries] = await Promise.all([
    Vehicle.find({ seller: user._id, status: { $ne: 'removed' } }).sort({ createdAt: -1 }).limit(50),
    Enquiry.find({ $or: [{ seller: user._id }, { buyer: user._id }] }).sort({ createdAt: -1 }).limit(30),
  ]);
  return {
    user: toAuthUser(user),
    vehicles: vehicles.map((vehicle) => toVehicle(vehicle, { admin: true })),
    enquiries: enquiries.map(toEnquiry),
  };
}

export async function updateUser(admin, id, body) {
  const user = await User.findById(id);
  if (!user) throw httpError(404, 'User not found.');
  if (body.name != null) user.name = String(body.name).trim().slice(0, 80);
  if (body.phone != null) user.phone = String(body.phone).trim().slice(0, 30);
  if (body.location != null) user.location = String(body.location).trim().slice(0, 120);
  if (body.email != null) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Enter a valid email address.');
    const clash = await User.findOne({ email, _id: { $ne: user._id } });
    if (clash) throw httpError(409, 'An account with this email already exists.');
    user.email = email;
  }
  if (body.role && ['buyer', 'individual', 'dealer'].includes(body.role)) user.role = body.role;
  if (body.dealershipName != null) user.dealershipName = String(body.dealershipName).trim().slice(0, 120);
  if (body.description != null) user.description = String(body.description).trim().slice(0, 2000);
  if (body.address != null) user.address = String(body.address).trim().slice(0, 200);
  if (body.businessDetails != null) user.businessDetails = String(body.businessDetails).trim().slice(0, 2000);
  if (user.role === 'dealer' && !user.dealershipName) throw httpError(400, 'Dealership name is required.');
  if (!user.name || !user.phone) throw httpError(400, 'Name and phone are required.');
  await user.save();
  await logActivity(admin, 'edit_user', `${admin.name} updated ${user.email}.`);
  return toAuthUser(user);
}

export async function setUserStatus(admin, id, status) {
  if (!['active', 'inactive', 'blocked'].includes(status)) throw httpError(400, 'Choose a valid account status.');
  const user = await User.findById(id);
  if (!user) throw httpError(404, 'User not found.');
  user.status = status;
  await user.save();
  if (status === 'inactive' || status === 'blocked') {
    await Vehicle.updateMany({ seller: user._id, status: { $in: ['active', 'pending'] } }, { status: 'inactive' });
    await notify(user._id, {
      type: 'account',
      title: status === 'blocked' ? 'Account blocked' : 'Account deactivated',
      body: status === 'blocked'
        ? 'Your Tchadvoiture account has been blocked.'
        : 'Your Tchadvoiture account has been deactivated.',
      link: '/account',
    });
  }
  await logActivity(admin, `user_${status}`, `${admin.name} set ${user.email} to ${status}.`);
  return toAuthUser(user);
}

export async function listAdminVehicles(req) {
  const { page, limit, skip } = pageQuery(req, 20);
  const filter = { status: { $ne: 'removed' } };
  if (['pending', 'active', 'rejected', 'inactive', 'sold'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.reported === 'true') {
    const ids = await Report.find({ status: 'open' }).distinct('vehicle');
    filter._id = { $in: ids };
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ makeName: rx }, { modelName: rx }, { location: rx }, { variant: rx }];
  }
  const [items, total] = await Promise.all([
    Vehicle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('seller', SELLER_FIELDS),
    Vehicle.countDocuments(filter),
  ]);
  return paged(items.map((vehicle) => toVehicle(vehicle, { admin: true })), total, page, limit);
}

export async function getAdminVehicle(id) {
  const vehicle = await Vehicle.findOne({ _id: id, status: { $ne: 'removed' } }).populate('seller', SELLER_FIELDS);
  if (!vehicle) throw httpError(404, 'Listing not found.');
  const reports = await Report.find({ vehicle: vehicle._id }).sort({ createdAt: -1 }).limit(20).populate('reporter', 'name email');
  return {
    vehicle: toVehicle(vehicle, { admin: true }),
    reports: reports.map((report) => ({
      id: String(report._id),
      reason: report.reason,
      status: report.status,
      reporterName: report.reporter?.name || '',
      reporterEmail: report.reporter?.email || '',
      createdAt: report.createdAt,
    })),
  };
}

export async function adminUpdateVehicle(admin, id, body) {
  const vehicle = await Vehicle.findOne({ _id: id, status: { $ne: 'removed' } });
  if (!vehicle) throw httpError(404, 'Listing not found.');
  const previous = vehicle.images.map((image) => image.filename);
  const fields = await resolveVehicleFields({
    makeId: body.makeId ?? vehicle.make,
    modelId: body.modelId ?? vehicle.model,
    fuelTypeId: body.fuelTypeId ?? vehicle.fuelType,
    transmissionId: body.transmissionId ?? vehicle.transmission,
    vehicleTypeId: body.vehicleTypeId ?? vehicle.vehicleType,
    variant: body.variant ?? vehicle.variant,
    manufacturingYear: body.manufacturingYear ?? vehicle.manufacturingYear,
    registrationYear: body.registrationYear ?? vehicle.registrationYear,
    kilometers: body.kilometers ?? vehicle.kilometers,
    owners: body.owners ?? vehicle.owners,
    condition: body.condition ?? vehicle.condition,
    price: body.price ?? vehicle.price,
    location: body.location ?? vehicle.location,
    color: body.color ?? vehicle.color,
    description: body.description ?? vehicle.description,
    registrationNumber: body.registrationNumber ?? vehicle.registrationNumber,
    insured: body.insured ?? vehicle.insured,
    insuranceExpiry: body.insuranceExpiry ?? vehicle.insuranceExpiry,
    insurancePolicyNumber: body.insurancePolicyNumber ?? vehicle.insurancePolicyNumber,
    specs: body.specs ?? vehicle.specs,
    images: body.images ?? vehicle.images,
  }, { requireImages: true });
  Object.assign(vehicle, fields);
  await vehicle.save();
  const next = new Set(vehicle.images.map((image) => image.filename));
  await Promise.all(previous.filter((filename) => !next.has(filename)).map((filename) => removeUpload(filename)));
  await logActivity(admin, 'edit_listing', `${admin.name} edited ${vehicleTitle(vehicle)}.`);
  return toVehicle(await vehicle.populate('seller', SELLER_FIELDS), { admin: true });
}

export async function moderateVehicle(admin, id, action, reason) {
  const vehicle = await Vehicle.findOne({ _id: id, status: { $ne: 'removed' } });
  if (!vehicle) throw httpError(404, 'Listing not found.');
  const title = vehicleTitle(vehicle);
  if (action === 'approve' || action === 'activate') {
    vehicle.status = 'active';
    vehicle.rejectionReason = '';
    await notify(vehicle.seller, {
      type: 'listing',
      title: action === 'approve' ? 'Listing approved' : 'Listing activated',
      body: `${title} is now public.`,
      link: `/cars/${vehicle._id}`,
    });
  } else if (action === 'reject') {
    const text = String(reason || '').trim();
    if (!text) throw httpError(400, 'A rejection reason is required.');
    vehicle.status = 'rejected';
    vehicle.rejectionReason = text.slice(0, 500);
    await notify(vehicle.seller, {
      type: 'listing',
      title: 'Listing rejected',
      body: `${title} was rejected: ${vehicle.rejectionReason}`,
      link: '/my-listings',
    });
  } else if (action === 'deactivate') {
    vehicle.status = 'inactive';
    await notify(vehicle.seller, {
      type: 'listing',
      title: 'Listing deactivated',
      body: `${title} is no longer public.`,
      link: '/my-listings',
    });
  } else if (action === 'sold') {
    vehicle.status = 'sold';
    await notify(vehicle.seller, {
      type: 'listing',
      title: 'Listing marked sold',
      body: `${title} was marked as sold.`,
      link: '/my-listings',
    });
  } else if (action === 'remove') {
    const filenames = vehicle.images.map((image) => image.filename);
    vehicle.status = 'removed';
    vehicle.images = [];
    await notify(vehicle.seller, {
      type: 'listing',
      title: 'Listing removed',
      body: `${title} was removed by an administrator.`,
      link: '/my-listings',
    });
    await vehicle.save();
    await Promise.all(filenames.map((filename) => removeUpload(filename)));
    await logActivity(admin, action, `${admin.name} removed ${title}.`);
    return toVehicle(vehicle, { admin: true });
  } else {
    throw httpError(400, 'Unknown action.');
  }
  await vehicle.save();
  await logActivity(admin, action, `${admin.name} set ${title} to ${vehicle.status}.`);
  return toVehicle(await Vehicle.findById(vehicle._id).populate('seller', SELLER_FIELDS), { admin: true });
}

export async function listAdminEnquiries(req) {
  const { page, limit, skip } = pageQuery(req, 20);
  const filter = {};
  if (['new', 'read', 'closed'].includes(req.query.status)) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Enquiry.countDocuments(filter),
  ]);
  return paged(items.map(toEnquiry), total, page, limit);
}

export async function listReports(req) {
  const { page, limit, skip } = pageQuery(req, 20);
  const filter = {};
  if (['open', 'dismissed', 'actioned'].includes(req.query.status)) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('reporter', 'name email').populate('vehicle', 'seller status'),
    Report.countDocuments(filter),
  ]);
  return paged(
    items.map((report) => ({
      id: String(report._id),
      vehicleId: String(report.vehicle?._id || report.vehicle),
      vehicleTitle: report.vehicleTitle,
      reason: report.reason,
      status: report.status,
      reporterName: report.reporter?.name || '',
      reporterEmail: report.reporter?.email || '',
      sellerId: report.vehicle?.seller ? String(report.vehicle.seller) : '',
      createdAt: report.createdAt,
    })),
    total,
    page,
    limit,
  );
}

export async function actOnReport(admin, id, action) {
  const report = await Report.findById(id).populate('vehicle');
  if (!report) throw httpError(404, 'Report not found.');
  if (action === 'dismiss') {
    report.status = 'dismissed';
    await report.save();
    await logActivity(admin, 'dismiss_report', `${admin.name} dismissed a report on ${report.vehicleTitle}.`);
    return { id: String(report._id), status: report.status };
  }
  if (action === 'takedown') {
    if (report.vehicle && report.vehicle.status !== 'removed') {
      report.vehicle.status = 'inactive';
      await report.vehicle.save();
      await notify(report.vehicle.seller, {
        type: 'listing',
        title: 'Listing taken down',
        body: `${report.vehicleTitle} was taken down after a report.`,
        link: '/my-listings',
      });
    }
    report.status = 'actioned';
    await report.save();
    await logActivity(admin, 'takedown', `${admin.name} took down ${report.vehicleTitle}.`);
    return { id: String(report._id), status: report.status };
  }
  if (action === 'block') {
    const sellerId = report.vehicle?.seller;
    if (sellerId) await setUserStatus(admin, sellerId, 'blocked');
    report.status = 'actioned';
    await report.save();
    return { id: String(report._id), status: report.status };
  }
  throw httpError(400, 'Unknown action.');
}

export async function updateSettings(admin, body) {
  const limit = Number(body.individualListingLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw httpError(400, 'Listing limit must be a whole number from 1 to 100.');
  }
  const currencyLabel = String(body.currencyLabel ?? '').trim().slice(0, 12);
  const settings = await Setting.findOneAndUpdate(
    { key: 'platform' },
    { individualListingLimit: limit, currencyLabel },
    { upsert: true, new: true },
  );
  await logActivity(admin, 'settings', `${admin.name} updated platform settings.`);
  return { individualListingLimit: settings.individualListingLimit, currencyLabel: settings.currencyLabel };
}

export async function createMake(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw httpError(400, 'Name is required.');
  const existing = await Make.findOne({ name: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') });
  if (existing) throw httpError(409, 'That make already exists.');
  const make = await Make.create({ name: trimmed.slice(0, 60) });
  return { id: String(make._id), name: make.name };
}

export async function deleteMake(id) {
  const used = await Vehicle.exists({ make: id, status: { $ne: 'removed' } });
  if (used) throw httpError(400, 'This make is used by a listing.');
  await Model.deleteMany({ make: id });
  const result = await Make.findByIdAndDelete(id);
  if (!result) throw httpError(404, 'Make not found.');
}

export async function createModel(makeId, name) {
  const make = await Make.findById(makeId);
  if (!make) throw httpError(404, 'Make not found.');
  const trimmed = String(name || '').trim();
  if (!trimmed) throw httpError(400, 'Name is required.');
  const model = await Model.create({ make: make._id, name: trimmed.slice(0, 60) });
  return { id: String(model._id), name: model.name, makeId: String(make._id) };
}

export async function deleteModel(id) {
  const used = await Vehicle.exists({ model: id, status: { $ne: 'removed' } });
  if (used) throw httpError(400, 'This model is used by a listing.');
  const result = await Model.findByIdAndDelete(id);
  if (!result) throw httpError(404, 'Model not found.');
}

export async function createLookup(kind, name) {
  if (!['vehicleType', 'fuel', 'transmission'].includes(kind)) throw httpError(400, 'Unknown catalog type.');
  const trimmed = String(name || '').trim();
  if (!trimmed) throw httpError(400, 'Name is required.');
  const item = await Lookup.create({ kind, name: trimmed.slice(0, 60) });
  return { id: String(item._id), kind: item.kind, name: item.name };
}

export async function deleteLookup(id) {
  const item = await Lookup.findById(id);
  if (!item) throw httpError(404, 'Item not found.');
  const field = item.kind === 'fuel' ? 'fuelType' : item.kind === 'transmission' ? 'transmission' : 'vehicleType';
  const used = await Vehicle.exists({ [field]: item._id, status: { $ne: 'removed' } });
  if (used) throw httpError(400, 'This item is used by a listing.');
  await item.deleteOne();
}

export async function listAnnouncements() {
  const items = await Announcement.find().sort({ createdAt: -1 }).limit(30);
  return items.map((item) => ({ id: String(item._id), title: item.title, body: item.body, createdAt: item.createdAt }));
}

export async function createAnnouncement(admin, { title, body }) {
  const heading = String(title || '').trim();
  const text = String(body || '').trim();
  if (!heading || !text) throw httpError(400, 'Title and message are required.');
  const announcement = await Announcement.create({
    title: heading.slice(0, 120),
    body: text.slice(0, 2000),
    createdBy: admin._id,
  });
  const users = await User.find({ status: 'active' }).select('_id');
  if (users.length) {
    await NotificationInsert(users, announcement);
  }
  await logActivity(admin, 'announcement', `${admin.name} posted “${announcement.title}”.`);
  return { id: String(announcement._id), title: announcement.title, body: announcement.body, createdAt: announcement.createdAt };
}

async function NotificationInsert(users, announcement) {
  const { Notification } = await import('./models.js');
  await Notification.insertMany(
    users.map((user) => ({
      user: user._id,
      type: 'announcement',
      title: announcement.title,
      body: announcement.body,
      link: '/notifications',
    })),
  );
}

export async function listPages() {
  const pages = await Page.find().sort({ slug: 1 });
  return pages.map((page) => ({ slug: page.slug, title: page.title, body: page.body }));
}

export async function updatePage(admin, slug, body) {
  if (!['about', 'contact', 'terms', 'privacy'].includes(slug)) throw httpError(404, 'Page not found.');
  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  if (!title) throw httpError(400, 'Title is required.');
  const page = await Page.findOneAndUpdate({ slug }, { title: title.slice(0, 120), body: text.slice(0, 8000) }, { new: true });
  if (!page) throw httpError(404, 'Page not found.');
  await logActivity(admin, 'edit_page', `${admin.name} updated the ${slug} page.`);
  return { slug: page.slug, title: page.title, body: page.body };
}
