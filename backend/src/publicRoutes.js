import { Router } from 'express';
import { Page } from './models.js';
import { httpError } from './lib.js';
import { optionalUser } from './middleware.js';
import { getCatalog, getPublicVehicle, getSellerProfile, getSettings, listPublicVehicles } from './vehicleService.js';

export const publicRouter = Router();

publicRouter.get('/settings', async (_req, res, next) => {
  try {
    res.json(await getSettings());
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/catalog', async (_req, res, next) => {
  try {
    res.json(await getCatalog());
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page || !['about', 'contact', 'terms'].includes(page.slug)) throw httpError(404, 'Page not found.');
    res.json({ slug: page.slug, title: page.title, body: page.body });
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/vehicles', optionalUser, async (req, res, next) => {
  try {
    res.json(await listPublicVehicles(req, req.user));
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/vehicles/:id', optionalUser, async (req, res, next) => {
  try {
    res.json({ vehicle: await getPublicVehicle(req.params.id, req.user) });
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/sellers/:id', async (req, res, next) => {
  try {
    res.json(await getSellerProfile(req.params.id));
  } catch (err) {
    next(err);
  }
});
