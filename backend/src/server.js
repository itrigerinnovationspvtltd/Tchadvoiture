import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { ensureSeed } from './seedData.js';
import { createApp } from './createApp.js';

const app = createApp();
const port = Number(process.env.PORT) || 4000;

connectDb()
  .then(() => ensureSeed())
  .then(() => {
    app.listen(port, () => {
      console.log(`Tchadvoiture API listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
