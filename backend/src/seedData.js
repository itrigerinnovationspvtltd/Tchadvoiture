import bcrypt from 'bcrypt';
import {
  Admin,
  Lookup,
  Make,
  Model,
  Page,
  Setting,
} from './models.js';

const MAKES = [
  ['Toyota', ['Corolla', 'Camry', 'RAV4', 'Hilux']],
  ['Honda', ['Civic', 'Accord', 'CR-V']],
  ['Hyundai', ['Tucson', 'Elantra', 'Creta']],
  ['Nissan', ['Patrol', 'Sunny', 'X-Trail']],
  ['Kia', ['Sportage', 'Cerato', 'Picanto']],
  ['Mercedes-Benz', ['C-Class', 'E-Class', 'GLE']],
];

const LOOKUPS = {
  fuel: ['Petrol', 'Diesel', 'Hybrid', 'Electric'],
  transmission: ['Manual', 'Automatic'],
  vehicleType: ['Sedan', 'SUV', 'Hatchback', 'Pickup', 'Van', 'Coupe'],
};

const PAGES = [
  {
    slug: 'about',
    title: 'About Tchadvoiture',
    body: 'Tchadvoiture is a marketplace for used cars. Buyers can browse approved listings, and individual sellers and dealers can publish vehicles after an admin review. Registration is free.',
  },
  {
    slug: 'contact',
    title: 'Contact',
    body: 'Questions about a vehicle go to the seller through the enquiry form on the listing. For platform help, use the details your administrator publishes here.',
  },
  {
    slug: 'terms',
    title: 'Terms',
    body: 'Listings must describe the vehicle accurately. Tchadvoiture may reject or remove listings and block accounts that break these terms. Seller phone numbers are not shown on public pages. Buyers share their contact details only when they send an enquiry.',
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    body:
      'Tchadvoiture collects account details you provide at sign-up and information you enter when listing a car or sending an enquiry.\n\n'
      + 'Seller phone numbers and private vehicle fields such as plate and insurance numbers are not shown on public listing pages. They are visible only to the seller and administrators.\n\n'
      + 'When you send an enquiry, the seller receives your name and phone number so they can reply. Enquiry history is available to you and the seller in the Enquiries section.\n\n'
      + 'We use your data to operate the marketplace, moderate listings, and respond to support requests. Contact support@tchadvoiture.com for privacy questions.',
  },
];

export async function ensureSeed() {
  const settings = await Setting.findOne({ key: 'platform' });
  if (!settings) await Setting.create({ key: 'platform', individualListingLimit: 3, currencyLabel: '' });

  const makeCount = await Make.countDocuments();
  if (makeCount === 0) {
    for (const [makeName, models] of MAKES) {
      const make = await Make.create({ name: makeName });
      await Model.insertMany(models.map((name) => ({ make: make._id, name })));
    }
  }

  for (const [kind, names] of Object.entries(LOOKUPS)) {
    for (const name of names) {
      await Lookup.updateOne({ kind, name }, { kind, name }, { upsert: true });
    }
  }

  for (const page of PAGES) {
    await Page.updateOne({ slug: page.slug }, page, { upsert: true });
  }

  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const existing = await Admin.findOne({ role: 'super_admin', status: 'active' });
    if (!existing) {
      await Admin.create({
        name: 'Super Admin',
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'super_admin',
        status: 'active',
      });
      console.log('Super admin created:', email);
    }
  }
}
