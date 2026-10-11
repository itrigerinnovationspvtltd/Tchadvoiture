import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { uploadsDir, vehicleTitle } from './lib.js';
import {
  Announcement,
  Enquiry,
  Lookup,
  Make,
  Model,
  Report,
  Setting,
  User,
  Vehicle,
} from './models.js';
import { ensureSeed } from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_ASSETS_DIR = path.resolve(__dirname, '../assets/demo-vehicles');
const DEMO_MARKER = 'demo-seed:';

const DEMO_PASSWORD = 'Demo12345!';

const DEMO_USERS = [
  {
    role: 'buyer',
    name: 'Amina Buyer',
    email: 'buyer@demo.tchadvoiture.local',
    phone: '+235 66 100 001',
    location: "N'Djamena",
  },
  {
    role: 'individual',
    name: 'Issa Moussa',
    email: 'individual@demo.tchadvoiture.local',
    phone: '+235 66 200 002',
    location: 'Moundou',
  },
  {
    role: 'dealer',
    name: 'Karim Ousmane',
    email: 'dealer@demo.tchadvoiture.local',
    phone: '+235 66 300 003',
    location: "N'Djamena",
    dealershipName: 'Sahel Auto House',
    address: 'Avenue Charles de Gaulle, N\'Djamena',
    description: 'Family-run dealership with inspected used cars and transparent pricing.',
    businessDetails: 'Open Mon–Sat, 8:00–18:00. Financing advice available on request.',
  },
];

function copyDemoImage(imageKey, assetBasename) {
  const filename = `demo-${imageKey}.jpg`;
  const dest = path.join(uploadsDir, filename);
  const src = path.join(DEMO_ASSETS_DIR, `${assetBasename}.jpg`);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing demo asset ${assetBasename}.jpg in backend/assets/demo-vehicles/`);
  }
  fs.copyFileSync(src, dest);
  return { url: `/uploads/${filename}`, filename };
}

function demoImages(imageKey, assets) {
  const list = Array.isArray(assets) ? assets : [assets];
  return list.map((asset, index) =>
    copyDemoImage(index === 0 ? imageKey : `${imageKey}-img${index + 1}`, asset),
  );
}

async function upsertUser(spec, passwordHash) {
  let user = await User.findOne({ email: spec.email });
  if (!user) {
    user = await User.create({ ...spec, passwordHash, status: 'active' });
    return { user, created: true };
  }
  Object.assign(user, { ...spec, status: 'active' });
  await user.save();
  return { user, created: false };
}

async function catalogEntry({ makeName, modelName, fuelName, transmissionName, vehicleTypeName }) {
  const make = await Make.findOne({ name: makeName });
  if (!make) throw new Error(`Make not found: ${makeName}`);
  const model = await Model.findOne({ make: make._id, name: modelName });
  if (!model) throw new Error(`Model not found: ${modelName} (${makeName})`);
  const fuel = await Lookup.findOne({ kind: 'fuel', name: fuelName });
  const transmission = await Lookup.findOne({ kind: 'transmission', name: transmissionName });
  const vehicleType = await Lookup.findOne({ kind: 'vehicleType', name: vehicleTypeName });
  if (!fuel || !transmission || !vehicleType) {
    throw new Error('Catalog lookup missing. Run npm run seed first.');
  }
  return {
    make,
    model,
    fuel,
    transmission,
    vehicleType,
    makeName,
    modelName,
    fuelName,
    transmissionName,
    vehicleTypeName,
  };
}

function vehiclePayload(seller, sellerRole, catalog, row) {
  return {
    seller: seller._id,
    sellerRole,
    make: catalog.make._id,
    model: catalog.model._id,
    makeName: catalog.makeName,
    modelName: catalog.modelName,
    variant: row.variant,
    manufacturingYear: row.year,
    registrationYear: row.registrationYear ?? row.year + 1,
    fuelType: catalog.fuel._id,
    fuelName: catalog.fuelName,
    transmission: catalog.transmission._id,
    transmissionName: catalog.transmissionName,
    vehicleType: catalog.vehicleType._id,
    vehicleTypeName: catalog.vehicleTypeName,
    kilometers: row.km,
    owners: row.owners,
    condition: row.condition,
    price: row.price,
    location: row.location,
    color: row.color,
    registrationNumber: row.plate,
    insured: row.insured ?? true,
    insuranceExpiry: row.insuranceExpiry ?? '2027-06',
    insurancePolicyNumber: row.policy,
    specs: row.specs ?? [],
    description: `${DEMO_MARKER} ${row.blurb}`,
    images: demoImages(row.imageKey, row.assets ?? row.assetFile),
    status: row.status,
    rejectionReason: row.rejectionReason || '',
  };
}

const DEMO_VEHICLE_ROWS = [
  {
    seller: 'individual',
    imageKey: 'corolla-moundou',
    assets: ['sedan-silver', 'sedan-black'],
    makeName: 'Toyota',
    modelName: 'Corolla',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: 'XLi',
    year: 2019,
    km: 72000,
    owners: 1,
    condition: 'Good',
    price: 4850000,
    location: 'Moundou',
    color: 'Silver',
    plate: 'TD-DEMO-001',
    policy: 'POL-DEMO-001',
    status: 'active',
    blurb: 'Well maintained Corolla with full service history and cold AC.',
    specs: [{ label: 'AC', value: 'Working' }, { label: 'Tyres', value: '70% tread' }],
  },
  {
    seller: 'individual',
    imageKey: 'civic-pending',
    assetFile: 'sedan-black',
    makeName: 'Honda',
    modelName: 'Civic',
    fuelName: 'Petrol',
    transmissionName: 'Manual',
    vehicleTypeName: 'Sedan',
    variant: 'LE',
    year: 2017,
    km: 98000,
    owners: 2,
    condition: 'Fair',
    price: 3600000,
    location: 'Moundou',
    color: 'White',
    plate: 'TD-DEMO-002',
    policy: 'POL-DEMO-002',
    status: 'pending',
    blurb: 'Honest daily driver awaiting admin approval.',
    specs: [{ label: 'Radio', value: 'Bluetooth' }],
  },
  {
    seller: 'dealer',
    imageKey: 'rav4-ndjamena',
    assetFile: 'suv-white',
    makeName: 'Toyota',
    modelName: 'RAV4',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'Adventure',
    year: 2020,
    km: 54000,
    owners: 1,
    condition: 'Excellent',
    price: 8200000,
    location: "N'Djamena",
    color: 'White',
    plate: 'TD-DEMO-101',
    policy: 'POL-DEMO-101',
    status: 'active',
    blurb: 'Dealer SUV with inspection report available.',
    specs: [{ label: 'Warranty', value: '3 months dealer' }],
  },
  {
    seller: 'dealer',
    imageKey: 'tucson-ndjamena',
    assetFile: 'suv-blue',
    makeName: 'Hyundai',
    modelName: 'Tucson',
    fuelName: 'Diesel',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'Premium',
    year: 2019,
    km: 61000,
    owners: 1,
    condition: 'Good',
    price: 7100000,
    location: "N'Djamena",
    color: 'Blue',
    plate: 'TD-DEMO-102',
    policy: 'POL-DEMO-102',
    status: 'active',
    blurb: 'Comfortable family SUV with service records.',
  },
  {
    seller: 'dealer',
    imageKey: 'sportage-ndjamena',
    assets: ['suv-blue', 'suv-white'],
    makeName: 'Kia',
    modelName: 'Sportage',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'GT-Line',
    year: 2021,
    km: 38000,
    owners: 1,
    condition: 'Excellent',
    price: 7900000,
    location: "N'Djamena",
    color: 'Red',
    plate: 'TD-DEMO-103',
    policy: 'POL-DEMO-103',
    status: 'active',
    blurb: 'Low mileage crossover ready for delivery.',
  },
  {
    seller: 'dealer',
    imageKey: 'xtrail-sarh',
    assets: ['suv-white'],
    makeName: 'Nissan',
    modelName: 'X-Trail',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'Tekna',
    year: 2018,
    km: 87000,
    owners: 2,
    condition: 'Good',
    price: 6500000,
    location: 'Sarh',
    color: 'Grey',
    plate: 'TD-DEMO-104',
    policy: 'POL-DEMO-104',
    status: 'active',
    blurb: 'Spacious SUV ideal for city and highway use.',
  },
  {
    seller: 'dealer',
    imageKey: 'hilux-abeche',
    assetFile: 'pickup-truck',
    makeName: 'Toyota',
    modelName: 'Hilux',
    fuelName: 'Diesel',
    transmissionName: 'Manual',
    vehicleTypeName: 'Pickup',
    variant: 'SR',
    year: 2016,
    km: 112000,
    owners: 2,
    condition: 'Good',
    price: 9200000,
    location: 'Abéché',
    color: 'White',
    plate: 'TD-DEMO-105',
    policy: 'POL-DEMO-105',
    status: 'active',
    blurb: 'Reliable pickup with bed liner and recent service.',
    specs: [{ label: 'Bed liner', value: 'Yes' }],
  },
  {
    seller: 'dealer',
    imageKey: 'mercedes-ndjamena',
    assets: ['luxury-sedan', 'sedan-black'],
    makeName: 'Mercedes-Benz',
    modelName: 'C-Class',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: '200',
    year: 2018,
    km: 76000,
    owners: 1,
    condition: 'Excellent',
    price: 12500000,
    location: "N'Djamena",
    color: 'Black',
    plate: 'TD-DEMO-106',
    policy: 'POL-DEMO-106',
    status: 'active',
    blurb: 'Premium sedan with leather interior and full options.',
    specs: [{ label: 'Seats', value: 'Leather' }],
  },
  {
    seller: 'dealer',
    imageKey: 'elantra-ndjamena',
    assetFile: 'sedan-black',
    makeName: 'Hyundai',
    modelName: 'Elantra',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: 'GLS',
    year: 2020,
    km: 45000,
    owners: 1,
    condition: 'Good',
    price: 5200000,
    location: "N'Djamena",
    color: 'Graphite',
    plate: 'TD-DEMO-107',
    policy: 'POL-DEMO-107',
    status: 'active',
    blurb: 'Efficient sedan with low running costs.',
  },
  {
    seller: 'dealer',
    imageKey: 'patrol-ndjamena',
    assets: ['pickup-truck', 'suv-blue'],
    makeName: 'Nissan',
    modelName: 'Patrol',
    fuelName: 'Diesel',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'SE',
    year: 2017,
    km: 95000,
    owners: 1,
    condition: 'Good',
    price: 11800000,
    location: "N'Djamena",
    color: 'White',
    plate: 'TD-DEMO-108',
    policy: 'POL-DEMO-108',
    status: 'active',
    blurb: 'Strong SUV for long trips and rough roads. Full service history.',
  },
  {
    seller: 'dealer',
    imageKey: 'camry-ndjamena',
    assets: ['sedan-silver', 'luxury-sedan'],
    makeName: 'Toyota',
    modelName: 'Camry',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: 'XSE',
    year: 2019,
    km: 58000,
    owners: 1,
    condition: 'Excellent',
    price: 8900000,
    location: "N'Djamena",
    color: 'Silver',
    plate: 'TD-DEMO-109',
    policy: 'POL-DEMO-109',
    status: 'active',
    blurb: 'Quiet, comfortable sedan with recent tyres and battery.',
  },
  {
    seller: 'dealer',
    imageKey: 'crv-moundou',
    assets: ['suv-white'],
    makeName: 'Honda',
    modelName: 'CR-V',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'Touring',
    year: 2018,
    km: 67000,
    owners: 2,
    condition: 'Good',
    price: 7400000,
    location: 'Moundou',
    color: 'White',
    plate: 'TD-DEMO-110',
    policy: 'POL-DEMO-110',
    status: 'active',
    blurb: 'Family SUV with spacious boot and cold AC.',
  },
  {
    seller: 'dealer',
    imageKey: 'picanto-ndjamena',
    assets: ['hatchback'],
    makeName: 'Kia',
    modelName: 'Picanto',
    fuelName: 'Petrol',
    transmissionName: 'Manual',
    vehicleTypeName: 'Hatchback',
    variant: 'LX',
    year: 2020,
    km: 32000,
    owners: 1,
    condition: 'Excellent',
    price: 4200000,
    location: "N'Djamena",
    color: 'Red',
    plate: 'TD-DEMO-111',
    policy: 'POL-DEMO-111',
    status: 'active',
    blurb: 'Compact city car, easy to park and very economical.',
  },
  {
    seller: 'dealer',
    imageKey: 'cerato-sarh',
    assets: ['sports-red', 'sedan-black'],
    makeName: 'Kia',
    modelName: 'Cerato',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: 'EX',
    year: 2019,
    km: 55000,
    owners: 1,
    condition: 'Good',
    price: 5600000,
    location: 'Sarh',
    color: 'Red',
    plate: 'TD-DEMO-112',
    policy: 'POL-DEMO-112',
    status: 'active',
    blurb: 'Well-kept sedan with Bluetooth and reverse camera.',
  },
  {
    seller: 'dealer',
    imageKey: 'sunny-abeche',
    assets: ['sedan-black'],
    makeName: 'Nissan',
    modelName: 'Sunny',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: 'SV',
    year: 2016,
    km: 105000,
    owners: 2,
    condition: 'Fair',
    price: 3800000,
    location: 'Abéché',
    color: 'Black',
    plate: 'TD-DEMO-113',
    policy: 'POL-DEMO-113',
    status: 'active',
    blurb: 'Affordable daily driver, ideal for first-time buyers.',
  },
  {
    seller: 'dealer',
    imageKey: 'hilux-ndjamena',
    assets: ['pickup-truck'],
    makeName: 'Toyota',
    modelName: 'Hilux',
    fuelName: 'Diesel',
    transmissionName: 'Manual',
    vehicleTypeName: 'Pickup',
    variant: 'SR',
    year: 2018,
    km: 89000,
    owners: 1,
    condition: 'Good',
    price: 9500000,
    location: "N'Djamena",
    color: 'White',
    plate: 'TD-DEMO-114',
    policy: 'POL-DEMO-114',
    status: 'active',
    blurb: 'Work-ready pickup with recent service and new tyres.',
  },
  {
    seller: 'individual',
    imageKey: 'creta-pending',
    assets: ['suv-white'],
    makeName: 'Hyundai',
    modelName: 'Creta',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'SUV',
    variant: 'SX',
    year: 2020,
    km: 41000,
    owners: 1,
    condition: 'Excellent',
    price: 6800000,
    location: 'Sarh',
    color: 'Grey',
    plate: 'TD-DEMO-115',
    policy: 'POL-DEMO-115',
    status: 'pending',
    blurb: 'Compact SUV pending admin approval for public listing.',
  },
  {
    seller: 'dealer',
    imageKey: 'elantra-moundou',
    assets: ['sedan-silver'],
    makeName: 'Hyundai',
    modelName: 'Elantra',
    fuelName: 'Petrol',
    transmissionName: 'Automatic',
    vehicleTypeName: 'Sedan',
    variant: 'GLS',
    year: 2021,
    km: 28000,
    owners: 1,
    condition: 'Excellent',
    price: 6100000,
    location: 'Moundou',
    color: 'Silver',
    plate: 'TD-DEMO-116',
    policy: 'POL-DEMO-116',
    status: 'active',
    blurb: 'Nearly new sedan with full dealer inspection.',
  },
];

async function seedDemoVehicles(individual, dealer) {
  await Vehicle.deleteMany({ description: new RegExp(`^${DEMO_MARKER}`) });

  for (const row of DEMO_VEHICLE_ROWS) {
    const seller = row.seller === 'dealer' ? dealer : individual;
    const sellerRole = row.seller === 'dealer' ? 'dealer' : 'individual';
    const catalog = await catalogEntry(row);
    await Vehicle.create(vehiclePayload(seller, sellerRole, catalog, row));
  }
  return DEMO_VEHICLE_ROWS.length;
}

async function createDemoEnquiry(buyer, seller, vehicle, message, status) {
  if (!vehicle) return;
  const exists = await Enquiry.findOne({ buyer: buyer._id, vehicle: vehicle._id });
  if (exists) return;
  await Enquiry.create({
    vehicle: vehicle._id,
    seller: seller._id,
    buyer: buyer._id,
    buyerName: buyer.name,
    buyerPhone: buyer.phone,
    buyerEmail: buyer.email,
    message,
    vehicleTitle: vehicleTitle(vehicle),
    status,
  });
}

async function seedDemoEnquiries(buyer, individual, dealer) {
  const individualListing = await Vehicle.findOne({
    seller: individual._id,
    status: 'active',
    description: new RegExp(`^${DEMO_MARKER}`),
  });
  await createDemoEnquiry(
    buyer,
    individual,
    individualListing,
    'Hello, is this car still available? I can visit this weekend.',
    'new',
  );

  const dealerListing = await Vehicle.findOne({
    seller: dealer._id,
    status: 'active',
    makeName: 'Toyota',
    modelName: 'RAV4',
    description: new RegExp(`^${DEMO_MARKER}`),
  });
  await createDemoEnquiry(
    buyer,
    dealer,
    dealerListing,
    'Can you share the inspection report and best price for cash payment?',
    'read',
  );

  const secondDealerListing = await Vehicle.findOne({
    seller: dealer._id,
    status: 'active',
    makeName: 'Hyundai',
    modelName: 'Elantra',
    description: new RegExp(`^${DEMO_MARKER}`),
  });
  await createDemoEnquiry(
    buyer,
    dealer,
    secondDealerListing,
    'Is financing available through your dealership for this model?',
    'new',
  );
}

async function seedDemoReport(buyer, dealer) {
  const vehicle = await Vehicle.findOne({
    seller: dealer._id,
    status: 'active',
    description: new RegExp(`^${DEMO_MARKER}`),
  }).sort({ createdAt: 1 });
  if (!vehicle) return;
  const exists = await Report.findOne({ vehicle: vehicle._id, reporter: buyer._id, status: 'open' });
  if (exists) return;
  await Report.create({
    vehicle: vehicle._id,
    reporter: buyer._id,
    reason: 'The mileage shown does not match wear visible in the listing photos.',
    vehicleTitle: vehicleTitle(vehicle),
    status: 'open',
  });
}

async function seedDemoAnnouncement() {
  const title = `${DEMO_MARKER} Demo environment`;
  const exists = await Announcement.findOne({ title });
  if (exists) return;
  await Announcement.create({
    title,
    body: 'This database includes sample users, listings, enquiries, and an open report for admin QA. Re-run npm run seed:demo to refresh demo vehicles.',
  });
}

function printCredentials() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@tchadvoiture.local';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || '(see .env SUPER_ADMIN_PASSWORD)';
  console.log('\n=== Login credentials ===\n');
  console.log('Admin panel: http://localhost:5173/admin/login');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}\n`);
  console.log('Marketplace (http://localhost:5173/login):');
  for (const user of DEMO_USERS) {
    console.log(`  ${user.role.padEnd(10)} ${user.email}  /  ${DEMO_PASSWORD}`);
  }
  console.log('\nAll demo marketplace accounts use the same password: Demo12345!');
}

async function main() {
  await connectDb();
  await ensureSeed();

  await Setting.updateOne(
    { key: 'platform' },
    { individualListingLimit: 3, currencyLabel: 'XAF' },
    { upsert: true },
  );

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = {};
  for (const spec of DEMO_USERS) {
    const { user } = await upsertUser(spec, passwordHash);
    users[spec.role] = user;
  }

  const vehicleCount = await seedDemoVehicles(users.individual, users.dealer);
  await seedDemoEnquiries(users.buyer, users.individual, users.dealer);
  await seedDemoReport(users.buyer, users.dealer);
  await seedDemoAnnouncement();

  const activeCount = DEMO_VEHICLE_ROWS.filter((row) => row.status === 'active').length;
  const pendingCount = DEMO_VEHICLE_ROWS.filter((row) => row.status === 'pending').length;
  console.log('Demo seed complete.');
  console.log(`  Users: buyer, individual seller, dealer`);
  console.log(`  Vehicles: ${vehicleCount} (${activeCount} active, ${pendingCount} pending for admin review)`);
  console.log('  Enquiries: up to 3 demo threads (new + read)');
  console.log('  Reports: 1 open demo report (admin Reports page)');
  console.log('  Announcements: 1 demo banner (admin Content page)');
  console.log('\n=== Demo presentation ===');
  console.log('  Marketplace: http://localhost:5173/');
  console.log('  Browse:      http://localhost:5173/cars');
  console.log('  (Start API: npm run dev  |  Frontend: npm run dev in frontend/)');
  printCredentials();
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
