import { Router } from 'express';
import {
  changePassword,
  loginAdmin,
  loginUser,
  logout,
  refreshAdminToken,
  refreshUserToken,
  setUserImage,
  signup,
  toAuthAdmin,
  toAuthUser,
  updateAdminProfile,
  updateProfile,
  uploadAvatar,
} from './authService.js';
import { bearerToken } from './authService.js';
import { authenticateAdmin, authenticateUser } from './middleware.js';

const router = Router();

function singleImage(field) {
  return (req, res, next) => {
    uploadAvatar.single(field)(req, res, (err) => (err ? next(err) : next()));
  };
}

router.post('/signup', async (req, res, next) => {
  try {
    res.status(201).json(await signup(req.body));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    res.json(await loginUser(req.body.email, req.body.password));
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    res.json(await refreshUserToken(req.body.refreshToken));
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await logout({ refreshToken: req.body.refreshToken, accessToken: bearerToken(req) });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticateUser, (req, res) => {
  res.json({ user: toAuthUser(req.user) });
});

router.patch('/me', authenticateUser, async (req, res, next) => {
  try {
    res.json({ user: await updateProfile(req.user, req.body) });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authenticateUser, async (req, res, next) => {
  try {
    await changePassword(req.user, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/avatar', authenticateUser, singleImage('file'), async (req, res, next) => {
  try {
    res.json({ user: await setUserImage(req.user, req.file, 'avatarUrl') });
  } catch (err) {
    next(err);
  }
});

router.post('/logo', authenticateUser, singleImage('file'), async (req, res, next) => {
  try {
    res.json({ user: await setUserImage(req.user, req.file, 'logoUrl') });
  } catch (err) {
    next(err);
  }
});

export const authRouter = router;

const adminAuth = Router();

adminAuth.post('/login', async (req, res, next) => {
  try {
    res.json(await loginAdmin(req.body.email, req.body.password));
  } catch (err) {
    next(err);
  }
});

adminAuth.post('/refresh', async (req, res, next) => {
  try {
    res.json(await refreshAdminToken(req.body.refreshToken));
  } catch (err) {
    next(err);
  }
});

adminAuth.post('/logout', async (req, res, next) => {
  try {
    await logout({ refreshToken: req.body.refreshToken, accessToken: bearerToken(req) });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminAuth.get('/me', authenticateAdmin, (req, res) => {
  res.json({ admin: toAuthAdmin(req.admin) });
});

adminAuth.patch('/me', authenticateAdmin, async (req, res, next) => {
  try {
    res.json({ admin: await updateAdminProfile(req.admin, req.body) });
  } catch (err) {
    next(err);
  }
});

adminAuth.post('/change-password', authenticateAdmin, async (req, res, next) => {
  try {
    await changePassword(req.admin, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export const adminAuthRouter = adminAuth;
