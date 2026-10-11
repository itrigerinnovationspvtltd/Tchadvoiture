import { bearerToken, loadAdminFromAccessToken, loadUserFromAccessToken } from './authService.js';

export async function authenticateUser(req, res, next) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    req.user = await loadUserFromAccessToken(token);
    next();
  } catch (err) {
    const status = err.status || 401;
    res.status(status).json({ error: status === 403 ? err.message : 'Invalid or expired token.' });
  }
}

export async function optionalUser(req, _res, next) {
  try {
    const token = bearerToken(req);
    if (token) req.user = await loadUserFromAccessToken(token);
  } catch {
    req.user = null;
  }
  next();
}

export async function authenticateAdmin(req, res, next) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    req.admin = await loadAdminFromAccessToken(token);
    next();
  } catch (err) {
    const status = err.status || 401;
    res.status(status).json({ error: status === 403 ? err.message : 'Invalid or expired token.' });
  }
}

export function requireSeller(req, res, next) {
  if (!req.user || !['individual', 'dealer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Seller access is required.' });
  }
  next();
}
