import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const ACCESS_TTL = '1h';
const CLIENT_ACCESS_TTL = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function adminSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
  return secret;
}

function clientSecret() {
  const secret = process.env.JWT_CLIENT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_CLIENT_SECRET is not set');
  return secret;
}

export function signAdminAccessToken(admin) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
      type: 'admin',
      email: admin.email,
      jti,
    },
    adminSecret(),
    { expiresIn: ACCESS_TTL },
  );
  return { token, jti };
}

export function signClientAccessToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      type: 'client',
      role: user.role,
      email: user.email,
      jti,
    },
    clientSecret(),
    { expiresIn: CLIENT_ACCESS_TTL },
  );
  return { token, jti };
}

export function signRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  return { token, expiresAt, tokenHash: hashToken(token) };
}

export function verifyAdminAccessToken(token) {
  return jwt.verify(token, adminSecret());
}

export function verifyClientAccessToken(token) {
  return jwt.verify(token, clientSecret());
}

export function decodeTokenUnsafe(token) {
  return jwt.decode(token);
}

export function pageQuery(req, fallbackLimit = 12) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || fallbackLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function paged(items, total, page, limit) {
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export function vehicleTitle(vehicle) {
  return [vehicle.manufacturingYear, vehicle.makeName, vehicle.modelName, vehicle.variant]
    .filter(Boolean)
    .join(' ');
}
