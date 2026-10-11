#!/usr/bin/env node
/**
 * Login as super admin and call GET /api/admin/users (same as curl with Bearer token).
 * Usage: node scripts/admin-api-curl-example.mjs
 */
import 'dotenv/config';

const base = process.env.API_BASE || 'http://localhost:4000';
const email = process.env.SUPER_ADMIN_EMAIL || 'admin@tchadvoiture.local';
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!password) {
  console.error('Set SUPER_ADMIN_PASSWORD in backend/.env');
  process.exit(1);
}

const loginRes = await fetch(`${base}/api/admin/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const loginBody = await loginRes.json();
if (!loginRes.ok) {
  console.error('Login failed:', loginRes.status, loginBody);
  process.exit(1);
}

const usersRes = await fetch(`${base}/api/admin/users?role=&q=`, {
  headers: { Authorization: `Bearer ${loginBody.accessToken}` },
});
const usersBody = await usersRes.json();
console.log('GET /api/admin/users →', usersRes.status);
if (!usersRes.ok) {
  console.error(usersBody);
  process.exit(1);
}
console.log('total users:', usersBody.total ?? usersBody.items?.length ?? 0);
