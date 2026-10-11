import { Router } from 'express';
import { authenticateAdmin } from './middleware.js';
import {
  actOnReport,
  adminUpdateVehicle,
  createAnnouncement,
  createLookup,
  createMake,
  createModel,
  dashboard,
  deleteLookup,
  deleteMake,
  deleteModel,
  getAdminVehicle,
  getUser,
  listAdminEnquiries,
  listAdminVehicles,
  listAnnouncements,
  listPages,
  listReports,
  listUsers,
  moderateVehicle,
  setUserStatus,
  updatePage,
  updateSettings,
  updateUser,
} from './adminService.js';

export const adminRouter = Router();
adminRouter.use(authenticateAdmin);

adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    res.json(await dashboard());
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    res.json(await listUsers(req));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    res.json(await getUser(req.params.id));
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    res.json({ user: await updateUser(req.admin, req.params.id, req.body) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/users/:id/status', async (req, res, next) => {
  try {
    res.json({ user: await setUserStatus(req.admin, req.params.id, req.body.status) });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/vehicles', async (req, res, next) => {
  try {
    res.json(await listAdminVehicles(req));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/vehicles/:id', async (req, res, next) => {
  try {
    res.json(await getAdminVehicle(req.params.id));
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/vehicles/:id', async (req, res, next) => {
  try {
    res.json({ vehicle: await adminUpdateVehicle(req.admin, req.params.id, req.body) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/vehicles/:id/moderate', async (req, res, next) => {
  try {
    res.json({ vehicle: await moderateVehicle(req.admin, req.params.id, req.body.action, req.body.reason) });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/enquiries', async (req, res, next) => {
  try {
    res.json(await listAdminEnquiries(req));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/reports', async (req, res, next) => {
  try {
    res.json(await listReports(req));
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/reports/:id', async (req, res, next) => {
  try {
    res.json(await actOnReport(req.admin, req.params.id, req.body.action));
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/settings', async (req, res, next) => {
  try {
    res.json(await updateSettings(req.admin, req.body));
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/catalog/makes', async (req, res, next) => {
  try {
    res.status(201).json(await createMake(req.body.name));
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/catalog/makes/:id', async (req, res, next) => {
  try {
    await deleteMake(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/catalog/models', async (req, res, next) => {
  try {
    res.status(201).json(await createModel(req.body.makeId, req.body.name));
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/catalog/models/:id', async (req, res, next) => {
  try {
    await deleteModel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/catalog/lookups', async (req, res, next) => {
  try {
    res.status(201).json(await createLookup(req.body.kind, req.body.name));
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/catalog/lookups/:id', async (req, res, next) => {
  try {
    await deleteLookup(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/announcements', async (_req, res, next) => {
  try {
    res.json({ announcements: await listAnnouncements() });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/announcements', async (req, res, next) => {
  try {
    res.status(201).json(await createAnnouncement(req.admin, req.body));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/pages', async (_req, res, next) => {
  try {
    res.json({ pages: await listPages() });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/pages/:slug', async (req, res, next) => {
  try {
    res.json(await updatePage(req.admin, req.params.slug, req.body));
  } catch (err) {
    next(err);
  }
});
