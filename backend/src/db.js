import mongoose from 'mongoose';

const ATLAS_HINT =
  'If using MongoDB Atlas: confirm the cluster is not paused, add your public IP (IPv4 and IPv6) under Network Access, and verify MONGODB_URI in .env.';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  const options = {
    serverSelectionTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  };

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, options);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < maxAttempts) {
        console.warn(`MongoDB connect attempt ${attempt}/${maxAttempts} failed: ${message}`);
        console.warn('Retrying in 3s…');
        await mongoose.disconnect().catch(() => {});
        await sleep(3000);
      }
    }
  }

  console.error(ATLAS_HINT);
  throw lastError;
}
