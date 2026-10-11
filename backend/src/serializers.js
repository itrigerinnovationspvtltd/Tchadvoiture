import { vehicleTitle } from './lib.js';

export function toPublicProfile(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id || user),
    role: user.role,
    name: user.name,
    location: user.location || '',
    avatarUrl: user.avatarUrl || '',
    dealershipName: user.dealershipName || '',
    logoUrl: user.logoUrl || '',
    description: user.description || '',
    address: user.address || '',
    businessDetails: user.businessDetails || '',
  };
}

export function toVehicle(vehicle, { owner = false, favourited = false, admin = false } = {}) {
  const sellerDoc = vehicle.seller && vehicle.seller.name ? vehicle.seller : null;
  const data = {
    id: String(vehicle._id),
    title: vehicleTitle(vehicle),
    makeId: String(vehicle.make),
    modelId: String(vehicle.model),
    makeName: vehicle.makeName,
    modelName: vehicle.modelName,
    variant: vehicle.variant || '',
    manufacturingYear: vehicle.manufacturingYear,
    registrationYear: vehicle.registrationYear,
    fuelTypeId: String(vehicle.fuelType),
    fuelName: vehicle.fuelName,
    transmissionId: String(vehicle.transmission),
    transmissionName: vehicle.transmissionName,
    vehicleTypeId: String(vehicle.vehicleType),
    vehicleTypeName: vehicle.vehicleTypeName,
    kilometers: vehicle.kilometers,
    owners: vehicle.owners,
    condition: vehicle.condition,
    price: vehicle.price,
    location: vehicle.location,
    color: vehicle.color || '',
    description: vehicle.description,
    specs: vehicle.specs || [],
    images: vehicle.images || [],
    insured: Boolean(vehicle.insured),
    insuranceExpiry: vehicle.insured ? vehicle.insuranceExpiry || '' : '',
    sellerRole: vehicle.sellerRole,
    seller: sellerDoc ? toPublicProfile(sellerDoc) : { id: String(vehicle.seller) },
    status: vehicle.status,
    createdAt: vehicle.createdAt,
    favourited,
  };
  if (owner || admin) {
    data.rejectionReason = vehicle.rejectionReason || '';
    data.registrationNumber = vehicle.registrationNumber || '';
    data.insurancePolicyNumber = vehicle.insurancePolicyNumber || '';
    data.updatedAt = vehicle.updatedAt;
  }
  if (admin && sellerDoc) {
    data.seller = {
      ...data.seller,
      email: sellerDoc.email,
      phone: sellerDoc.phone,
      status: sellerDoc.status,
    };
  }
  return data;
}

export function toEnquiry(enquiry) {
  return {
    id: String(enquiry._id),
    vehicleId: String(enquiry.vehicle?._id || enquiry.vehicle),
    vehicleTitle: enquiry.vehicleTitle,
    sellerId: String(enquiry.seller?._id || enquiry.seller),
    buyerId: String(enquiry.buyer?._id || enquiry.buyer),
    buyerName: enquiry.buyerName,
    buyerPhone: enquiry.buyerPhone,
    buyerEmail: enquiry.buyerEmail,
    message: enquiry.message,
    status: enquiry.status,
    createdAt: enquiry.createdAt,
  };
}

export function toNotification(item) {
  return {
    id: String(item._id),
    type: item.type,
    title: item.title,
    body: item.body,
    link: item.link || '',
    read: Boolean(item.readAt),
    createdAt: item.createdAt,
  };
}
