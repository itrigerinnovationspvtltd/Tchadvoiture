#!/usr/bin/env node
/**
 * Prints public IPs to whitelist in Atlas → Network Access, then pings MongoDB.
 * Usage: node scripts/atlas-network-check.mjs  (from backend/, loads .env)
 */
import 'dotenv/config';
import mongoose from 'mongoose';

console.log('Add these IPs in MongoDB Atlas → Network Access → IP Access List:\n');
for (const [label, url] of [
  ['IPv4', 'https://ipv4.ifconfig.me/ip'],
  ['IPv6', 'https://ipv6.ifconfig.me/ip'],
]) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const ip = res.ok ? (await res.text()).trim() : '(unavailable)';
    console.log(`  ${label}: ${ip}`);
  } catch {
    console.log(`  ${label}: (could not detect)`);
  }
}

console.log('\nAlso confirm the cluster is resumed (not paused).\n');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

try {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 45000, connectTimeoutMS: 30000 });
  const ping = await mongoose.connection.db.admin().command({ ping: 1 });
  console.log('MongoDB ping:', ping);
  await mongoose.disconnect();
} catch (err) {
  console.error('MongoDB connection failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
