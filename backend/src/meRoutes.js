import { Router } from 'express';
import { storedFile, uploadImages } from './authService.js';
import { httpError } from './lib.js';
import { authenticateUser, requireSeller } from './middleware.js';
import {
  addWishlist,
  createEnquiry,
  createReport,
  listEnquiries,
  listNotifications,
  listWishlist,
  markAllNotificationsRead,
  markNotificationRead,
  notificationSummary,
  removeWishlist,
  updateEnquiryStatus,
} from './engagementService.js';
import { changeMyVehicleStatus, createVehicle, getMyVehicle, listMyVehicles, updateMyVehicle } from './vehicleService.js';

export const meRouter = Router();
meRouter.use(authenticateUser);

function manyImages(req, res, next) {
  uploadImages.array('files', 12)(req, res, (err) => (err ? next(err) : next()));
}

meRouter.post('/uploads', manyImages, (req, res, next) => {
  try {
    const files = (req.files || []).map(storedFile);
    if (!files.length) throw httpError(400, 'Choose at least one image.');
    res.status(201).json({ files });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/vehicles', requireSeller, async (req, res, next) => {
  try {
    res.json({ vehicles: await listMyVehicles(req.user) });
  } catch (err) {
    next(err);
  }
});

meRouter.post('/vehicles', requireSeller, async (req, res, next) => {
  try {
    res.status(201).json({ vehicle: await createVehicle(req.user, req.body) });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/vehicles/:id', requireSeller, async (req, res, next) => {
  try {
    res.json({ vehicle: await getMyVehicle(req.user, req.params.id) });
  } catch (err) {
    next(err);
  }
});

meRouter.patch('/vehicles/:id', requireSeller, async (req, res, next) => {
  try {
    res.json({ vehicle: await updateMyVehicle(req.user, req.params.id, req.body) });
  } catch (err) {
    next(err);
  }
});

meRouter.post('/vehicles/:id/status', requireSeller, async (req, res, next) => {
  try {
    res.json({ vehicle: await changeMyVehicleStatus(req.user, req.params.id, req.body.action) });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/enquiries', async (req, res, next) => {
  try {
    res.json({ enquiries: await listEnquiries(req.user, req.query.box) });
  } catch (err) {
    next(err);
  }
});

meRouter.patch('/enquiries/:id', async (req, res, next) => {
  try {
    res.json({ enquiry: await updateEnquiryStatus(req.user, req.params.id, req.body.status) });
  } catch (err) {
    next(err);
  }
});

meRouter.post('/enquiries', async (req, res, next) => {
  try {
    res.status(201).json({ enquiry: await createEnquiry(req.user, req.body) });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/wishlist', async (req, res, next) => {
  try {
    res.json({ vehicles: await listWishlist(req.user) });
  } catch (err) {
    next(err);
  }
});

meRouter.post('/wishlist', async (req, res, next) => {
  try {
    res.status(201).json(await addWishlist(req.user, req.body.vehicleId));
  } catch (err) {
    next(err);
  }
});

meRouter.delete('/wishlist/:vehicleId', async (req, res, next) => {
  try {
    res.json(await removeWishlist(req.user, req.params.vehicleId));
  } catch (err) {
    next(err);
  }
});

meRouter.post('/reports', async (req, res, next) => {
  try {
    res.status(201).json(await createReport(req.user, req.body));
  } catch (err) {
    next(err);
  }
});

meRouter.get('/notifications/summary', async (req, res, next) => {
  try {
    res.json(await notificationSummary(req.user));
  } catch (err) {
    next(err);
  }
});

meRouter.get('/notifications', async (req, res, next) => {
  try {
    res.json(await listNotifications(req.user, req));
  } catch (err) {
    next(err);
  }
});

meRouter.post('/notifications/read-all', async (req, res, next) => {
  try {
    await markAllNotificationsRead(req.user);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

meRouter.patch('/notifications/:id', async (req, res, next) => {
  try {
    res.json({ notification: await markNotificationRead(req.user, req.params.id) });
  } catch (err) {
    next(err);
  }
});
