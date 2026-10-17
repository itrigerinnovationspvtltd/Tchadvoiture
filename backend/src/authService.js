import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { Admin, RefreshToken, RevokedToken, User } from './models.js';
import {
  decodeTokenUnsafe,
  hashToken,
  httpError,
  signAdminAccessToken,
  signClientAccessToken,
  signRefreshToken,
  uploadsDir,
  verifyAdminAccessToken,
  verifyClientAccessToken,
} from './lib.js';

const MAX_FAILED = 5;
const LOCKOUT_MINUTES = 15;

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
  },
});

function imageFilter(_req, file, cb) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(httpError(400, 'Only JPEG, PNG, and WebP images are allowed.'));
    return;
  }
  cb(null, true);
}

export const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
});

export const uploadAvatar = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

export function storedFile(file) {
  return { url: `/uploads/${file.filename}`, filename: file.filename };
}

export async function removeUpload(filename) {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) return;
  await fs.unlink(path.join(uploadsDir, filename)).catch(() => {});
}

function filenameFromUrl(url) {
  if (!url?.startsWith('/uploads/')) return '';
  return path.basename(url);
}

async function issueSession(subjectType, subject) {
  const access = subjectType === 'admin' ? signAdminAccessToken(subject) : signClientAccessToken(subject);
  const refresh = signRefreshToken();
  await RefreshToken.create({
    subjectType,
    subjectId: subject._id,
    tokenHash: refresh.tokenHash,
    expiresAt: refresh.expiresAt,
  });
  return { accessToken: access.token, refreshToken: refresh.token };
}

async function assertPassword(account, password) {
  if (account.lockedUntil && account.lockedUntil > new Date()) {
    const mins = Math.ceil((account.lockedUntil.getTime() - Date.now()) / 60000);
    throw httpError(429, `Account locked after too many failed attempts. Try again in ${mins} minute(s).`);
  }
  const { default: bcrypt } = await import('bcrypt');
  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    account.failedLoginAttempts = (account.failedLoginAttempts || 0) + 1;
    if (account.failedLoginAttempts >= MAX_FAILED) {
      account.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }
    await account.save();
    throw httpError(401, 'Invalid email or password.');
  }
  if (account.failedLoginAttempts || account.lockedUntil) {
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
  }
}

export function toAuthUser(user) {
  return {
    id: String(user._id),
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location || '',
    avatarUrl: user.avatarUrl || '',
    dealershipName: user.dealershipName || '',
    logoUrl: user.logoUrl || '',
    description: user.description || '',
    address: user.address || '',
    businessDetails: user.businessDetails || '',
    status: user.status,
  };
}

export function toAuthAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
  };
}

export async function signup(body) {
  const role = body.role;
  if (!['buyer', 'individual', 'dealer'].includes(role)) {
    throw httpError(400, 'Choose Buyer, Individual Seller, or Dealer.');
  }
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const password = String(body.password || '');
  const location = String(body.location || '').trim();
  if (!name || !email || !phone || !password) {
    throw httpError(400, 'Name, email, phone, and password are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Enter a valid email address.');
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');
  const dealershipName = String(body.dealershipName || '').trim();
  if (role === 'dealer' && !dealershipName) throw httpError(400, 'Dealership name is required.');
  const existing = await User.findOne({ email });
  if (existing) throw httpError(409, 'An account with this email already exists.');
  const { default: bcrypt } = await import('bcrypt');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    role,
    name: name.slice(0, 80),
    email,
    phone: phone.slice(0, 30),
    passwordHash,
    location: location.slice(0, 120),
    status: 'active',
    dealershipName: role === 'dealer' ? dealershipName.slice(0, 120) : '',
    description: role === 'dealer' ? String(body.description || '').trim().slice(0, 2000) : '',
    address: role === 'dealer' ? String(body.address || '').trim().slice(0, 200) : '',
    businessDetails: role === 'dealer' ? String(body.businessDetails || '').trim().slice(0, 2000) : '',
  });
  const tokens = await issueSession('user', user);
  return { ...tokens, user: toAuthUser(user) };
}

export async function loginUser(emailRaw, password) {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (!email || !password) throw httpError(400, 'Email and password are required.');
  const user = await User.findOne({ email });
  if (!user) throw httpError(401, 'Invalid email or password.');
  await assertPassword(user, password);
  if (user.status !== 'active') {
    throw httpError(403, user.status === 'blocked' ? 'This account has been blocked.' : 'This account is deactivated.');
  }
  user.lastLoginAt = new Date();
  await user.save();
  await RefreshToken.updateMany(
    { subjectType: 'user', subjectId: user._id, revokedAt: null },
    { revokedAt: new Date() },
  );
  const tokens = await issueSession('user', user);
  return { ...tokens, user: toAuthUser(user) };
}

export async function loginAdmin(emailRaw, password) {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (!email || !password) throw httpError(400, 'Email and password are required.');
  const admin = await Admin.findOne({ email });
  if (!admin || admin.status !== 'active') throw httpError(401, 'Invalid email or password.');
  await assertPassword(admin, password);
  admin.lastLoginAt = new Date();
  await admin.save();
  await RefreshToken.updateMany(
    { subjectType: 'admin', subjectId: admin._id, revokedAt: null },
    { revokedAt: new Date() },
  );
  const tokens = await issueSession('admin', admin);
  return { ...tokens, admin: toAuthAdmin(admin) };
}

async function rotateRefresh(subjectType, refreshToken, Model, toPublic) {
  if (!refreshToken) throw httpError(400, 'Refresh token is required.');
  const stored = await RefreshToken.findOne({
    tokenHash: hashToken(refreshToken),
    subjectType,
    revokedAt: null,
  });
  if (!stored || stored.expiresAt < new Date()) throw httpError(401, 'Invalid refresh token.');
  const account = await Model.findById(stored.subjectId);
  if (!account || account.status !== 'active') throw httpError(403, 'Account is not active.');
  stored.revokedAt = new Date();
  await stored.save();
  const tokens = await issueSession(subjectType, account);
  const key = subjectType === 'admin' ? 'admin' : 'user';
  return { ...tokens, [key]: toPublic(account) };
}

export function refreshUserToken(refreshToken) {
  return rotateRefresh('user', refreshToken, User, toAuthUser);
}

export function refreshAdminToken(refreshToken) {
  return rotateRefresh('admin', refreshToken, Admin, toAuthAdmin);
}

export async function logout({ refreshToken, accessToken }) {
  if (refreshToken) {
    await RefreshToken.updateOne({ tokenHash: hashToken(refreshToken) }, { revokedAt: new Date() });
  }
  if (accessToken) {
    const decoded = decodeTokenUnsafe(accessToken);
    if (decoded?.jti && decoded?.exp) {
      await RevokedToken.updateOne(
        { jti: decoded.jti },
        { jti: decoded.jti, expiresAt: new Date(decoded.exp * 1000) },
        { upsert: true },
      );
    }
  }
}

export async function updateAdminProfile(admin, body) {
  if (body.name == null) throw httpError(400, 'Name is required.');
  const name = String(body.name).trim().slice(0, 80);
  if (!name) throw httpError(400, 'Name is required.');
  admin.name = name;
  await admin.save();
  return toAuthAdmin(admin);
}

export async function updateProfile(user, body) {
  if (body.name != null) user.name = String(body.name).trim().slice(0, 80);
  if (body.phone != null) user.phone = String(body.phone).trim().slice(0, 30);
  if (body.location != null) user.location = String(body.location).trim().slice(0, 120);
  if (!user.name || !user.phone) throw httpError(400, 'Name and phone are required.');
  if (user.role === 'dealer') {
    if (body.dealershipName != null) user.dealershipName = String(body.dealershipName).trim().slice(0, 120);
    if (body.description != null) user.description = String(body.description).trim().slice(0, 2000);
    if (body.address != null) user.address = String(body.address).trim().slice(0, 200);
    if (body.businessDetails != null) user.businessDetails = String(body.businessDetails).trim().slice(0, 2000);
    if (!user.dealershipName) throw httpError(400, 'Dealership name is required.');
  }
  await user.save();
  return toAuthUser(user);
}

export async function changePassword(account, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) throw httpError(400, 'Current and new passwords are required.');
  if (String(newPassword).length < 8) throw httpError(400, 'Password must be at least 8 characters.');
  const { default: bcrypt } = await import('bcrypt');
  const valid = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!valid) throw httpError(400, 'Current password is incorrect.');
  account.passwordHash = await bcrypt.hash(String(newPassword), 12);
  account.failedLoginAttempts = 0;
  account.lockedUntil = null;
  await account.save();
  await RefreshToken.updateMany({ subjectId: account._id, revokedAt: null }, { revokedAt: new Date() });
}

export async function setUserImage(user, file, field) {
  if (!file) throw httpError(400, 'Choose an image.');
  if (field === 'logoUrl' && user.role !== 'dealer') throw httpError(403, 'Only dealers can upload a logo.');
  const previous = filenameFromUrl(user[field]);
  user[field] = storedFile(file).url;
  await user.save();
  if (previous && previous !== file.filename) await removeUpload(previous);
  return toAuthUser(user);
}

export async function isRevoked(jti) {
  if (!jti) return false;
  return Boolean(await RevokedToken.exists({ jti }));
}

export function bearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function loadUserFromAccessToken(token) {
  const payload = verifyClientAccessToken(token);
  if (payload.type !== 'client') throw httpError(401, 'Invalid token type.');
  if (await isRevoked(payload.jti)) throw httpError(401, 'Token has been revoked.');
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw httpError(403, 'Account is not active.');
  return user;
}

export async function loadAdminFromAccessToken(token) {
  const payload = verifyAdminAccessToken(token);
  if (payload.type !== 'admin') throw httpError(401, 'Invalid token type.');
  if (await isRevoked(payload.jti)) throw httpError(401, 'Token has been revoked.');
  const admin = await Admin.findById(payload.sub);
  if (!admin || admin.status !== 'active') throw httpError(403, 'Account is not active.');
  return admin;
}
