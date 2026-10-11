import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import request from 'supertest';
import { connectDb } from '../src/db.js';
import { createApp } from '../src/createApp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_JPG = path.join(__dirname, 'fixtures/sample.jpg');
const DEMO_PASSWORD = 'Demo12345!';
const BUYER_EMAIL = 'buyer@demo.tchadvoiture.local';
const INDIVIDUAL_EMAIL = 'individual@demo.tchadvoiture.local';
const DEALER_EMAIL = 'dealer@demo.tchadvoiture.local';

const results = [];

function expectStatus(name, res, allowed) {
  const codes = Array.isArray(allowed) ? allowed : [allowed];
  const ok = codes.includes(res.status);
  results.push({ name, ok, status: res.status, allowed: codes.join('|') });
  if (!ok) {
    console.error(`FAIL ${name}: expected ${codes.join(' or ')}, got ${res.status}`, res.body);
  }
  return ok;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function loginUser(app, email, password = DEMO_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expectStatus(`POST /api/auth/login (${email})`, res, 200);
  return res.body;
}

async function loginAdmin(app) {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD required in backend/.env');
  }
  const res = await request(app).post('/api/admin/auth/login').send({ email, password });
  expectStatus('POST /api/admin/auth/login', res, 200);
  return res.body;
}

async function main() {
  if (!fs.existsSync(FIXTURE_JPG)) {
    console.error('Missing upload fixture:', FIXTURE_JPG);
    process.exit(1);
  }

  await connectDb();
  const app = createApp();

  // --- Public ---
  let res = await request(app).get('/api/health');
  expectStatus('GET /api/health', res, 200);

  res = await request(app).get('/api/settings');
  expectStatus('GET /api/settings', res, 200);
  const settingsBefore = res.body;

  res = await request(app).get('/api/catalog');
  expectStatus('GET /api/catalog', res, 200);
  const catalog = res.body;
  const toyota = catalog.makes.find((m) => m.name === 'Toyota');
  const corolla = toyota?.models?.find((m) => m.name === 'Corolla');
  const fuel = catalog.fuels[0];
  const transmission = catalog.transmissions[0];
  const vehicleType = catalog.vehicleTypes[0];

  for (const slug of ['about', 'contact', 'terms']) {
    res = await request(app).get(`/api/pages/${slug}`);
    expectStatus(`GET /api/pages/${slug}`, res, 200);
  }

  res = await request(app).get('/api/vehicles?limit=5&sort=newest');
  expectStatus('GET /api/vehicles', res, 200);
  const activeVehicle = res.body.items?.find((v) => v.status === 'active') ?? res.body.items?.[0];
  if (!activeVehicle) {
    console.error('No vehicles in DB. Run: npm run seed && npm run seed:demo');
    process.exit(1);
  }
  const vehicleId = activeVehicle.id;
  const sellerId = activeVehicle.seller?.id;

  res = await request(app).get(`/api/vehicles/${vehicleId}`);
  expectStatus('GET /api/vehicles/:id', res, 200);

  res = await request(app).get(`/api/sellers/${sellerId}`);
  expectStatus('GET /api/sellers/:id', res, 200);

  res = await request(app).get('/api/vehicles/not-an-object-id');
  expectStatus('GET /api/vehicles/:id invalid', res, 400);

  // --- Signup (disposable) ---
  const smokeEmail = `smoke-${Date.now()}@test.tchadvoiture.local`;
  res = await request(app).post('/api/auth/signup').send({
    role: 'buyer',
    name: 'Smoke Test',
    email: smokeEmail,
    phone: '+235 66 999 999',
    password: 'SmokeTest1!',
    location: "N'Djamena",
  });
  expectStatus('POST /api/auth/signup', res, 201);
  const smokeTokens = res.body;

  res = await request(app).post('/api/me/enquiries').send({ vehicleId, message: 'No auth' });
  expectStatus('POST /api/me/enquiries unauthenticated', res, 401);

  // --- Buyer ---
  const buyer = await loginUser(app, BUYER_EMAIL);

  res = await request(app).get('/api/vehicles?limit=1&sort=newest');
  expectStatus('GET /api/vehicles (buyer refresh)', res, 200);
  const buyerVehicleId = res.body.items?.[0]?.id ?? vehicleId;

  res = await request(app).get('/api/auth/me').set(auth(buyer.accessToken));
  expectStatus('GET /api/auth/me', res, 200);

  res = await request(app).patch('/api/auth/me').set(auth(buyer.accessToken)).send({ location: "N'Djamena" });
  expectStatus('PATCH /api/auth/me', res, 200);

  res = await request(app).get('/api/me/vehicles').set(auth(buyer.accessToken));
  expectStatus('GET /api/me/vehicles as buyer', res, 403);

  res = await request(app).post('/api/me/wishlist').set(auth(buyer.accessToken)).send({ vehicleId: buyerVehicleId });
  expectStatus('POST /api/me/wishlist', res, [200, 201]);

  res = await request(app).get('/api/me/wishlist').set(auth(buyer.accessToken));
  expectStatus('GET /api/me/wishlist', res, 200);

  res = await request(app).delete(`/api/me/wishlist/${buyerVehicleId}`).set(auth(buyer.accessToken));
  expectStatus('DELETE /api/me/wishlist/:vehicleId', res, 200);

  res = await request(app).post('/api/me/enquiries').set(auth(buyer.accessToken)).send({
    vehicleId: buyerVehicleId,
    message: 'Smoke test enquiry — is this vehicle still available?',
  });
  expectStatus('POST /api/me/enquiries', res, [200, 201]);

  res = await request(app).get('/api/me/enquiries?box=sent').set(auth(buyer.accessToken));
  expectStatus('GET /api/me/enquiries?box=sent', res, 200);

  res = await request(app).post('/api/me/reports').set(auth(buyer.accessToken)).send({
    vehicleId: buyerVehicleId,
    reason: `Smoke test report ${Date.now()} — checking moderation flow.`,
  });
  expectStatus('POST /api/me/reports', res, [201, 409]);

  res = await request(app).get('/api/me/notifications/summary').set(auth(buyer.accessToken));
  expectStatus('GET /api/me/notifications/summary', res, 200);

  res = await request(app).get('/api/me/notifications').set(auth(buyer.accessToken));
  expectStatus('GET /api/me/notifications', res, 200);
  const noticeId = res.body.items?.[0]?.id;

  if (noticeId) {
    res = await request(app).patch(`/api/me/notifications/${noticeId}`).set(auth(buyer.accessToken)).send({});
    expectStatus('PATCH /api/me/notifications/:id', res, 200);
  }

  res = await request(app).post('/api/me/notifications/read-all').set(auth(buyer.accessToken)).send({});
  expectStatus('POST /api/me/notifications/read-all', res, 200);

  res = await request(app)
    .post('/api/auth/avatar')
    .set(auth(buyer.accessToken))
    .attach('file', FIXTURE_JPG);
  expectStatus('POST /api/auth/avatar', res, 200);

  res = await request(app)
    .post('/api/auth/change-password')
    .set(auth(buyer.accessToken))
    .send({ currentPassword: 'wrong', newPassword: 'NewPass123!' });
  expectStatus('POST /api/auth/change-password (wrong current)', res, 400);

  const buyerRefresh = buyer.refreshToken;
  res = await request(app).post('/api/auth/refresh').send({ refreshToken: buyerRefresh });
  expectStatus('POST /api/auth/refresh', res, 200);
  const buyerAfterRefresh = res.body;

  res = await request(app).post('/api/auth/logout').set(auth(buyerAfterRefresh.accessToken)).send({
    refreshToken: buyerAfterRefresh.refreshToken,
  });
  expectStatus('POST /api/auth/logout', res, 200);

  // --- Individual seller ---
  const individual = await loginUser(app, INDIVIDUAL_EMAIL);

  res = await request(app).get('/api/me/vehicles').set(auth(individual.accessToken));
  expectStatus('GET /api/me/vehicles (individual)', res, 200);
  for (const v of res.body.vehicles ?? []) {
    if (String(v.description || '').includes('Smoke test listing created by api-smoke')) {
      const removed = await request(app)
        .post(`/api/me/vehicles/${v.id}/status`)
        .set(auth(individual.accessToken))
        .send({ action: 'remove' });
      expectStatus('POST /api/me/vehicles/:id/status remove (cleanup)', removed, 200);
    }
  }
  res = await request(app).get('/api/me/vehicles').set(auth(individual.accessToken));
  expectStatus('GET /api/me/vehicles (individual refresh)', res, 200);
  const individualListings = res.body.vehicles ?? [];
  const individualActiveCount = individualListings.filter(
    (v) => v.status === 'pending' || v.status === 'active',
  ).length;
  const pendingVehicle = individualListings.find((v) => v.status === 'pending');
  const myVehicleId = pendingVehicle?.id ?? individualListings[0]?.id;

  if (myVehicleId) {
    res = await request(app).get(`/api/me/vehicles/${myVehicleId}`).set(auth(individual.accessToken));
    expectStatus('GET /api/me/vehicles/:id', res, 200);

    res = await request(app)
      .patch(`/api/me/vehicles/${myVehicleId}`)
      .set(auth(individual.accessToken))
      .send({
        description: 'Smoke test updated description with enough characters for validation rules.',
      });
    expectStatus('PATCH /api/me/vehicles/:id', res, 200);
  }

  res = await request(app)
    .post('/api/me/uploads')
    .set(auth(individual.accessToken))
    .attach('files', FIXTURE_JPG);
  expectStatus('POST /api/me/uploads', res, 201);
  const uploadedFile = res.body.files?.[0];

  if (uploadedFile && toyota && corolla && fuel && transmission && vehicleType) {
    if (individualActiveCount >= 3) {
      results.push({
        name: 'POST /api/me/vehicles (skipped at listing limit)',
        ok: true,
        status: 0,
        allowed: 'skip',
      });
    } else {
      res = await request(app)
        .post('/api/me/vehicles')
        .set(auth(individual.accessToken))
        .send({
          makeId: toyota.id,
          modelId: corolla.id,
          fuelTypeId: fuel.id,
          transmissionId: transmission.id,
          vehicleTypeId: vehicleType.id,
          variant: 'Smoke',
          manufacturingYear: 2018,
          registrationYear: 2019,
          kilometers: 50000,
          owners: 1,
          condition: 'Good',
          price: 4000000,
          location: 'Moundou',
          color: 'Blue',
          description: 'Smoke test listing created by api-smoke for endpoint coverage.',
          registrationNumber: `SMOKE-${Date.now()}`,
          insured: true,
          insuranceExpiry: '2027-01',
          insurancePolicyNumber: 'SMOKE-POL',
          specs: [{ label: 'Test', value: 'Yes' }],
          images: [uploadedFile],
        });
      expectStatus('POST /api/me/vehicles', res, [200, 201]);
      const createdId = res.body.vehicle?.id;
      if (createdId) {
        res = await request(app)
          .post(`/api/me/vehicles/${createdId}/status`)
          .set(auth(individual.accessToken))
          .send({ action: 'remove' });
        expectStatus('POST /api/me/vehicles/:id/status remove', res, 200);
      }
    }
  }

  res = await request(app).get('/api/me/enquiries?box=inbox').set(auth(individual.accessToken));
  expectStatus('GET /api/me/enquiries?box=inbox', res, 200);
  const inboxEnquiry = res.body.enquiries?.[0];
  if (inboxEnquiry?.id) {
    res = await request(app)
      .patch(`/api/me/enquiries/${inboxEnquiry.id}`)
      .set(auth(individual.accessToken))
      .send({ status: 'read' });
    expectStatus('PATCH /api/me/enquiries/:id', res, 200);
  }

  // --- Dealer ---
  const dealer = await loginUser(app, DEALER_EMAIL);
  res = await request(app).get('/api/me/vehicles').set(auth(dealer.accessToken));
  expectStatus('GET /api/me/vehicles (dealer)', res, 200);

  res = await request(app)
    .post('/api/auth/logo')
    .set(auth(dealer.accessToken))
    .attach('file', FIXTURE_JPG);
  expectStatus('POST /api/auth/logo', res, 200);

  // --- Admin ---
  const admin = await loginAdmin(app);

  res = await request(app).get('/api/admin/auth/me').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/auth/me', res, 200);

  res = await request(app).get('/api/admin/dashboard').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/dashboard', res, 200);

  res = await request(app).get('/api/admin/users?role=buyer&q=').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/users', res, 200);
  const demoBuyer = res.body.items?.find((u) => u.email === BUYER_EMAIL);

  res = await request(app).get('/api/admin/vehicles?status=pending').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/vehicles', res, 200);
  const adminPending = res.body.items?.[0];

  res = await request(app).get('/api/admin/enquiries').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/enquiries', res, 200);

  res = await request(app).get('/api/admin/reports?status=open').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/reports', res, 200);
  const openReport = res.body.items?.[0];

  if (adminPending?.id) {
    res = await request(app).get(`/api/admin/vehicles/${adminPending.id}`).set(auth(admin.accessToken));
    expectStatus('GET /api/admin/vehicles/:id', res, 200);

    res = await request(app)
      .post(`/api/admin/vehicles/${adminPending.id}/moderate`)
      .set(auth(admin.accessToken))
      .send({ action: 'approve' });
    expectStatus('POST /api/admin/vehicles/:id/moderate approve', res, 200);

    res = await request(app)
      .patch(`/api/admin/vehicles/${adminPending.id}`)
      .set(auth(admin.accessToken))
      .send({ color: 'Silver' });
    expectStatus('PATCH /api/admin/vehicles/:id', res, 200);
  }

  if (openReport?.id) {
    res = await request(app)
      .post(`/api/admin/reports/${openReport.id}`)
      .set(auth(admin.accessToken))
      .send({ action: 'dismiss' });
    expectStatus('POST /api/admin/reports/:id dismiss', res, 200);
  }

  res = await request(app).get('/api/admin/pages').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/pages', res, 200);
  const aboutPage = res.body.pages?.find((p) => p.slug === 'about');
  if (aboutPage) {
    const originalBody = aboutPage.body;
    res = await request(app)
      .put('/api/admin/pages/about')
      .set(auth(admin.accessToken))
      .send({ ...aboutPage, body: `${originalBody}\n` });
    expectStatus('PUT /api/admin/pages/:slug', res, 200);
    await request(app)
      .put('/api/admin/pages/about')
      .set(auth(admin.accessToken))
      .send({ ...aboutPage, body: originalBody });
  }

  res = await request(app)
    .post('/api/admin/announcements')
    .set(auth(admin.accessToken))
    .send({ title: 'Smoke test', body: 'API smoke test announcement.' });
  expectStatus('POST /api/admin/announcements', res, [200, 201]);

  res = await request(app).get('/api/admin/announcements').set(auth(admin.accessToken));
  expectStatus('GET /api/admin/announcements', res, 200);

  const makeName = `SmokeMake${Date.now()}`;
  res = await request(app)
    .post('/api/admin/catalog/makes')
    .set(auth(admin.accessToken))
    .send({ name: makeName });
  expectStatus('POST /api/admin/catalog/makes', res, [200, 201]);
  const smokeMakeId = res.body.id;

  if (smokeMakeId) {
    res = await request(app)
      .post('/api/admin/catalog/models')
      .set(auth(admin.accessToken))
      .send({ makeId: smokeMakeId, name: 'SmokeModel' });
    expectStatus('POST /api/admin/catalog/models', res, [200, 201]);
    const smokeModelId = res.body.id;
    if (smokeModelId) {
      res = await request(app).delete(`/api/admin/catalog/models/${smokeModelId}`).set(auth(admin.accessToken));
      expectStatus('DELETE /api/admin/catalog/models/:id', res, 200);
    }
    res = await request(app).delete(`/api/admin/catalog/makes/${smokeMakeId}`).set(auth(admin.accessToken));
    expectStatus('DELETE /api/admin/catalog/makes/:id', res, 200);
  }

  const lookupName = `SmokeFuel${Date.now()}`;
  res = await request(app)
    .post('/api/admin/catalog/lookups')
    .set(auth(admin.accessToken))
    .send({ kind: 'fuel', name: lookupName });
  expectStatus('POST /api/admin/catalog/lookups', res, [200, 201]);
  const smokeLookupId = res.body.id;
  if (smokeLookupId) {
    res = await request(app).delete(`/api/admin/catalog/lookups/${smokeLookupId}`).set(auth(admin.accessToken));
    expectStatus('DELETE /api/admin/catalog/lookups/:id', res, 200);
  }

  res = await request(app)
    .put('/api/admin/settings')
    .set(auth(admin.accessToken))
    .send({
      individualListingLimit: settingsBefore.individualListingLimit,
      currencyLabel: settingsBefore.currencyLabel || 'XAF',
    });
  expectStatus('PUT /api/admin/settings', res, 200);

  if (demoBuyer?.id) {
    res = await request(app).get(`/api/admin/users/${demoBuyer.id}`).set(auth(admin.accessToken));
    expectStatus('GET /api/admin/users/:id', res, 200);

    res = await request(app)
      .patch(`/api/admin/users/${demoBuyer.id}`)
      .set(auth(admin.accessToken))
      .send({ location: demoBuyer.location || "N'Djamena" });
    expectStatus('PATCH /api/admin/users/:id', res, 200);

    res = await request(app)
      .post(`/api/admin/users/${demoBuyer.id}/status`)
      .set(auth(admin.accessToken))
      .send({ status: 'active' });
    expectStatus('POST /api/admin/users/:id/status', res, 200);
  }

  res = await request(app)
    .post('/api/admin/auth/change-password')
    .set(auth(admin.accessToken))
    .send({ currentPassword: 'wrong-password', newPassword: 'AdminNew123!' });
  expectStatus('POST /api/admin/auth/change-password (wrong current)', res, 400);

  res = await request(app).post('/api/admin/auth/refresh').send({ refreshToken: admin.refreshToken });
  expectStatus('POST /api/admin/auth/refresh', res, 200);
  const adminRefreshed = res.body;

  res = await request(app)
    .post('/api/admin/auth/logout')
    .set(auth(adminRefreshed.accessToken))
    .send({ refreshToken: adminRefreshed.refreshToken });
  expectStatus('POST /api/admin/auth/logout', res, 200);

  // Smoke user change-password (does not affect demo accounts)
  res = await request(app)
    .post('/api/auth/change-password')
    .set(auth(smokeTokens.accessToken))
    .send({ currentPassword: 'SmokeTest1!', newPassword: 'SmokeTest2!' });
  expectStatus('POST /api/auth/change-password', res, 200);

  await mongoose.disconnect();

  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);
  console.log('\nAPI smoke test results');
  console.log(`  Passed: ${passed.length}`);
  console.log(`  Failed: ${failed.length}`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  - ${f.name} (${f.status}, expected ${f.allowed})`));
    process.exit(1);
  }
  console.log('  All checks passed.\n');
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
