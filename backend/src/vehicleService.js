import { CONDITIONS, COUNTED_STATUSES, Lookup, Make, Model, Setting, User, Vehicle } from './models.js';
import { escapeRegex, httpError, pageQuery, paged } from './lib.js';
import { removeUpload } from './authService.js';
import { toPublicProfile, toVehicle } from './serializers.js';

export async function getSettings() {
  const settings = await Setting.findOne({ key: 'platform' });
  return {
    individualListingLimit: settings?.individualListingLimit ?? 3,
    currencyLabel: settings?.currencyLabel ?? '',
  };
}

export async function getCatalog() {
  const [makes, lookups, settings] = await Promise.all([
    Make.find().sort({ name: 1 }),
    Lookup.find().sort({ name: 1 }),
    getSettings(),
  ]);
  const models = await Model.find().sort({ name: 1 });
  return {
    makes: makes.map((make) => ({
      id: String(make._id),
      name: make.name,
      models: models
        .filter((model) => String(model.make) === String(make._id))
        .map((model) => ({ id: String(model._id), name: model.name })),
    })),
    fuels: lookups.filter((item) => item.kind === 'fuel').map(toLookup),
    transmissions: lookups.filter((item) => item.kind === 'transmission').map(toLookup),
    vehicleTypes: lookups.filter((item) => item.kind === 'vehicleType').map(toLookup),
    conditions: CONDITIONS,
    settings,
  };
}

function toLookup(item) {
  return { id: String(item._id), name: item.name, kind: item.kind };
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .slice(0, 12)
    .map((image) => ({
      url: String(image?.url || ''),
      filename: String(image?.filename || ''),
    }))
    .filter(
      (image) =>
        image.url === `/uploads/${image.filename}` &&
        image.filename &&
        !image.filename.includes('..') &&
        !image.filename.includes('/') &&
        !image.filename.includes('\\'),
    );
}

export async function resolveVehicleFields(body, { requireImages = false } = {}) {
  const make = await Make.findById(body.makeId);
  const model = await Model.findOne({ _id: body.modelId, make: body.makeId });
  const fuel = await Lookup.findOne({ _id: body.fuelTypeId, kind: 'fuel' });
  const transmission = await Lookup.findOne({ _id: body.transmissionId, kind: 'transmission' });
  const vehicleType = await Lookup.findOne({ _id: body.vehicleTypeId, kind: 'vehicleType' });
  if (!make || !model || !fuel || !transmission || !vehicleType) {
    throw httpError(400, 'Choose a valid make, model, fuel type, transmission, and vehicle type.');
  }

  const now = new Date().getFullYear() + 1;
  const manufacturingYear = Number(body.manufacturingYear);
  if (!Number.isInteger(manufacturingYear) || manufacturingYear < 1950 || manufacturingYear > now) {
    throw httpError(400, 'Enter a valid manufacturing year.');
  }

  let registrationYear = null;
  if (body.registrationYear !== '' && body.registrationYear != null) {
    registrationYear = Number(body.registrationYear);
    if (!Number.isInteger(registrationYear) || registrationYear < 1950 || registrationYear > now) {
      throw httpError(400, 'Enter a valid registration year.');
    }
  }

  const kilometers = Number(body.kilometers);
  const owners = Number(body.owners);
  const price = Number(body.price);
  if (!Number.isFinite(kilometers) || kilometers < 0) throw httpError(400, 'Enter kilometers driven.');
  if (!Number.isInteger(owners) || owners < 1 || owners > 20) throw httpError(400, 'Enter the number of owners.');
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, 'Enter a valid price.');
  if (!CONDITIONS.includes(body.condition)) throw httpError(400, 'Choose a vehicle condition.');

  const location = String(body.location || '').trim();
  const description = String(body.description || '').trim();
  if (!location) throw httpError(400, 'Location is required.');
  if (description.length < 20) throw httpError(400, 'Description should be at least 20 characters.');

  const specs = Array.isArray(body.specs)
    ? body.specs
        .slice(0, 20)
        .map((spec) => ({
          label: String(spec?.label || '').trim().slice(0, 60),
          value: String(spec?.value || '').trim().slice(0, 120),
        }))
        .filter((spec) => spec.label && spec.value)
    : [];

  const images = normalizeImages(body.images);
  if (requireImages && images.length === 0) throw httpError(400, 'Add at least one photo.');

  return {
    make: make._id,
    model: model._id,
    makeName: make.name,
    modelName: model.name,
    variant: String(body.variant || '').trim().slice(0, 80),
    manufacturingYear,
    registrationYear,
    fuelType: fuel._id,
    fuelName: fuel.name,
    transmission: transmission._id,
    transmissionName: transmission.name,
    vehicleType: vehicleType._id,
    vehicleTypeName: vehicleType.name,
    kilometers,
    owners,
    condition: body.condition,
    price,
    location: location.slice(0, 120),
    color: String(body.color || '').trim().slice(0, 40),
    registrationNumber: String(body.registrationNumber || '').trim().slice(0, 40),
    insured: Boolean(body.insured),
    insuranceExpiry: body.insured ? String(body.insuranceExpiry || '').slice(0, 40) : '',
    insurancePolicyNumber: body.insured ? String(body.insurancePolicyNumber || '').trim().slice(0, 60) : '',
    specs,
    description: description.slice(0, 5000),
    images,
  };
}

async function assertListingLimit(user) {
  if (user.role === 'dealer') return;
  if (user.role !== 'individual') throw httpError(403, 'Only sellers can create listings.');
  const settings = await getSettings();
  const count = await Vehicle.countDocuments({ seller: user._id, status: { $in: COUNTED_STATUSES } });
  if (count >= settings.individualListingLimit) {
    throw httpError(
      400,
      `Individual sellers can have up to ${settings.individualListingLimit} pending or active listings.`,
    );
  }
}

async function activeSellerIds(sellerRole) {
  const filter = { status: 'active', role: sellerRole || { $in: ['individual', 'dealer'] } };
  return User.find(filter).distinct('_id');
}

export async function listPublicVehicles(req, viewer) {
  const { page, limit, skip } = pageQuery(req);
  const sellerRole = ['individual', 'dealer'].includes(req.query.sellerType) ? req.query.sellerType : undefined;
  const filter = { status: 'active', seller: { $in: await activeSellerIds(sellerRole) } };

  if (req.query.makeId) filter.make = req.query.makeId;
  if (req.query.modelId) filter.model = req.query.modelId;
  if (req.query.fuelTypeId) filter.fuelType = req.query.fuelTypeId;
  if (req.query.transmissionId) filter.transmission = req.query.transmissionId;
  if (req.query.vehicleTypeId) filter.vehicleType = req.query.vehicleTypeId;
  if (req.query.condition && CONDITIONS.includes(req.query.condition)) filter.condition = req.query.condition;
  if (req.query.owners) filter.owners = Number(req.query.owners);
  if (req.query.location) filter.location = new RegExp(escapeRegex(req.query.location), 'i');
  if (req.query.color) filter.color = new RegExp(escapeRegex(req.query.color), 'i');

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = minPrice;
    if (req.query.maxPrice) filter.price.$lte = maxPrice;
  }
  const minYear = Number(req.query.minYear);
  const maxYear = Number(req.query.maxYear);
  if (req.query.minYear || req.query.maxYear) {
    filter.manufacturingYear = {};
    if (req.query.minYear) filter.manufacturingYear.$gte = minYear;
    if (req.query.maxYear) filter.manufacturingYear.$lte = maxYear;
  }
  const minKm = Number(req.query.minKm);
  const maxKm = Number(req.query.maxKm);
  if (req.query.minKm || req.query.maxKm) {
    filter.kilometers = {};
    if (req.query.minKm) filter.kilometers.$gte = minKm;
    if (req.query.maxKm) filter.kilometers.$lte = maxKm;
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [
      { makeName: rx },
      { modelName: rx },
      { variant: rx },
      { description: rx },
      { location: rx },
      { color: rx },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    km_asc: { kilometers: 1 },
    year_desc: { manufacturingYear: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;
  const [items, total] = await Promise.all([
    Vehicle.find(filter).sort(sort).skip(skip).limit(limit).populate('seller', 'name role location avatarUrl logoUrl dealershipName description address businessDetails status'),
    Vehicle.countDocuments(filter),
  ]);
  const favIds = await favouriteIds(viewer, items.map((item) => item._id));
  return paged(
    items.map((item) => toVehicle(item, { favourited: favIds.has(String(item._id)) })),
    total,
    page,
    limit,
  );
}

async function favouriteIds(viewer, vehicleIds) {
  if (!viewer) return new Set();
  const { Wishlist } = await import('./models.js');
  const rows = await Wishlist.find({ user: viewer._id, vehicle: { $in: vehicleIds } }).select('vehicle');
  return new Set(rows.map((row) => String(row.vehicle)));
}

export async function getPublicVehicle(id, viewer) {
  const vehicle = await Vehicle.findOne({ _id: id, status: 'active' }).populate(
    'seller',
    'name role location avatarUrl logoUrl dealershipName description address businessDetails status',
  );
  if (!vehicle || vehicle.seller?.status !== 'active') throw httpError(404, 'Listing not found.');
  const favIds = await favouriteIds(viewer, [vehicle._id]);
  return toVehicle(vehicle, { favourited: favIds.has(String(vehicle._id)) });
}

export async function getSellerProfile(id) {
  const seller = await User.findOne({ _id: id, role: { $in: ['individual', 'dealer'] }, status: 'active' });
  if (!seller) throw httpError(404, 'Seller not found.');
  const vehicles = await Vehicle.find({ seller: seller._id, status: 'active' })
    .sort({ createdAt: -1 })
    .populate('seller', 'name role location avatarUrl logoUrl dealershipName description address businessDetails status');
  return {
    seller: toPublicProfile(seller),
    vehicles: vehicles.map((vehicle) => toVehicle(vehicle)),
  };
}

export async function createVehicle(user, body) {
  if (!['individual', 'dealer'].includes(user.role)) throw httpError(403, 'Only sellers can create listings.');
  await assertListingLimit(user);
  const fields = await resolveVehicleFields(body, { requireImages: true });
  const vehicle = await Vehicle.create({ ...fields, seller: user._id, sellerRole: user.role, status: 'pending' });
  return toVehicle(vehicle, { owner: true });
}

export async function listMyVehicles(user) {
  const vehicles = await Vehicle.find({ seller: user._id, status: { $ne: 'removed' } })
    .sort({ createdAt: -1 })
    .populate('seller', 'name role location avatarUrl logoUrl dealershipName description address businessDetails status');
  return vehicles.map((vehicle) => toVehicle(vehicle, { owner: true }));
}

export async function getMyVehicle(user, id) {
  const vehicle = await Vehicle.findOne({ _id: id, seller: user._id, status: { $ne: 'removed' } }).populate(
    'seller',
    'name role location avatarUrl logoUrl dealershipName description address businessDetails status',
  );
  if (!vehicle) throw httpError(404, 'Listing not found.');
  return toVehicle(vehicle, { owner: true });
}

export async function updateMyVehicle(user, id, body) {
  const vehicle = await Vehicle.findOne({ _id: id, seller: user._id, status: { $ne: 'removed' } });
  if (!vehicle) throw httpError(404, 'Listing not found.');
  if (vehicle.status === 'sold') throw httpError(400, 'Sold listings cannot be edited.');
  const previous = vehicle.images.map((image) => image.filename);
  const fields = await resolveVehicleFields(
    {
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
    },
    { requireImages: true },
  );
  Object.assign(vehicle, fields);
  try {
    await vehicle.save();
  } catch (err) {
    if (err.name !== 'VersionError') throw err;
    const fresh = await Vehicle.findOne({ _id: id, seller: user._id, status: { $ne: 'removed' } });
    if (!fresh) throw httpError(404, 'Listing not found.');
    Object.assign(fresh, fields);
    await fresh.save();
    vehicle = fresh;
  }
  const next = new Set(vehicle.images.map((image) => image.filename));
  await Promise.all(previous.filter((filename) => !next.has(filename)).map((filename) => removeUpload(filename)));
  return toVehicle(vehicle, { owner: true });
}

export async function changeMyVehicleStatus(user, id, action) {
  const vehicle = await Vehicle.findOne({ _id: id, seller: user._id, status: { $ne: 'removed' } });
  if (!vehicle) throw httpError(404, 'Listing not found.');
  if (action === 'deactivate') {
    if (vehicle.status !== 'active') throw httpError(400, 'Only an active listing can be deactivated.');
    vehicle.status = 'inactive';
  } else if (action === 'sold') {
    if (vehicle.status !== 'active') throw httpError(400, 'Only an active listing can be marked sold.');
    vehicle.status = 'sold';
  } else if (action === 'resubmit') {
    if (!['rejected', 'inactive'].includes(vehicle.status)) {
      throw httpError(400, 'Only a rejected or deactivated listing can be resubmitted.');
    }
    await assertListingLimit(user);
    vehicle.status = 'pending';
    vehicle.rejectionReason = '';
  } else if (action === 'remove') {
    const filenames = vehicle.images.map((image) => image.filename);
    vehicle.status = 'removed';
    vehicle.images = [];
    await vehicle.save();
    await Promise.all(filenames.map((filename) => removeUpload(filename)));
    return toVehicle(vehicle, { owner: true });
  } else {
    throw httpError(400, 'Unknown action.');
  }
  await vehicle.save();
  return toVehicle(vehicle, { owner: true });
}
