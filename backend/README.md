# Tchadvoiture API

Express + MongoDB marketplace backend.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`, JWT secrets, and super-admin credentials.
2. Install: `npm install`

### MongoDB Atlas

Use a **`mongodb+srv://`** URI from Atlas → Database → Connect → Drivers. URL-encode special characters in the database user password.

In Atlas → **Network Access**, allow your machine’s **IPv4 and IPv6** addresses (run `curl -4 https://ifconfig.me/ip` and `curl -6 https://ifconfig.me/ip`). Ensure the cluster is **resumed**, not paused.

If the API logs `ReplicaSetNoPrimary` or `secureConnect` timeouts, wait a minute after resuming the cluster and restart the API. Connection uses up to three retries with a 45s server selection window (`src/db.js`).

Quick check (from `backend/`):

```bash
node scripts/atlas-network-check.mjs
```

Prints your public IPv4/IPv6 for the Atlas allowlist and runs a MongoDB ping.

3. Seed catalog and demo data (photos + test users):

```bash
npm run seed
npm run seed:demo
```

Demo marketplace password: `Demo12345!` (see `seed:demo` output for emails).

`seed:demo` also loads sample enquiries, an open listing report, and a platform announcement so admin screens (Enquiries, Reports, Content) are populated for QA.

## Run

```bash
npm run dev    # watch mode
npm start      # production
```

Entry point: `src/server.js` (app factory: `src/createApp.js`).

## Admin API from curl

Admin routes need `Authorization: Bearer <accessToken>`. Without it, `/api/admin/users` returns **401**.

```bash
node scripts/admin-api-curl-example.mjs
```

Manual steps and port **5173** proxy notes: [docs/API.md](docs/API.md#testing-admin-with-curl).

## API tests

Hits every mounted route with realistic payloads (public, buyer, seller, dealer, admin):

```bash
npm run test:api
```

Requires MongoDB running and demo seed loaded. Upload fixture: `scripts/fixtures/sample.jpg`.

Endpoint list: [docs/API.md](docs/API.md).
