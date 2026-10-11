import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { ensureSeed } from './seedData.js';

connectDb()
  .then(() => ensureSeed())
  .then(async () => {
    console.log('Seed complete');
    await mongoose.disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
