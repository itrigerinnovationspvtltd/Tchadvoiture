# Tchadvoiture API reference

Base URL: `http://localhost:4000` (dev). JSON unless noted. Errors: `{ "error": "message" }`.

## Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | — |

## Public

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/settings` | — | Platform settings (currency label, listing limits) |
| GET | `/api/catalog` | — | Makes, models, fuels, transmissions, vehicle types |
| GET | `/api/pages/:slug` | — | CMS page (`about`, `contact`, `terms`) |
| GET | `/api/vehicles` | optional | Browse/search approved listings |
| GET | `/api/vehicles/:id` | optional | Listing detail |
| GET | `/api/sellers/:id` | — | Seller profile + active listings |

## User auth (`/api/auth`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/signup` | — |
| POST | `/login` | — |
| POST | `/refresh` | — |
| POST | `/logout` | optional Bearer |
| GET | `/me` | user |
| PATCH | `/me` | user |
| POST | `/change-password` | user |
| POST | `/avatar` | user (multipart `file`) |
| POST | `/logo` | dealer (multipart `file`) |

## Authenticated user (`/api/me`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/uploads` | seller | multipart `files` (max 12) |
| GET | `/vehicles` | seller | Own listings |
| POST | `/vehicles` | seller | Create (pending) |
| GET | `/vehicles/:id` | seller | Edit form |
| PATCH | `/vehicles/:id` | seller | Update draft/active listing |
| POST | `/vehicles/:id/status` | seller | `deactivate`, `sold`, `resubmit`, `remove` |
| GET | `/enquiries` | user | `?box=inbox` (seller) or `sent` (buyer) |
| POST | `/enquiries` | user | `{ vehicleId, message }` |
| PATCH | `/enquiries/:id` | seller | `{ status: new\|read\|closed }` |
| GET | `/wishlist` | user | |
| POST | `/wishlist` | user | `{ vehicleId }` |
| DELETE | `/wishlist/:vehicleId` | user | |
| POST | `/reports` | user | `{ vehicleId, reason }` |
| GET | `/notifications/summary` | user | `{ unreadCount }` |
| GET | `/notifications` | user | Paginated |
| PATCH | `/notifications/:id` | user | Mark read |
| POST | `/notifications/read-all` | user | |

## Admin auth (`/api/admin/auth`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/login` | — |
| POST | `/refresh` | — |
| POST | `/logout` | optional Bearer |
| GET | `/me` | admin |
| PATCH | `/me` | admin (`{ name }`) |
| POST | `/change-password` | admin |

## Admin (`/api/admin`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/dashboard` | Stats |
| GET | `/users` | `?role=&q=` |
| GET | `/users/:id` | Detail + listings |
| PATCH | `/users/:id` | Profile fields |
| POST | `/users/:id/status` | `{ status }` |
| GET | `/vehicles` | `?status=&q=` |
| GET | `/vehicles/:id` | Review + reports |
| PATCH | `/vehicles/:id` | Admin edit |
| POST | `/vehicles/:id/moderate` | `{ action, reason? }` approve/reject/… |
| GET | `/enquiries` | All enquiries |
| GET | `/reports` | `?status=open` |
| POST | `/reports/:id` | `{ action: dismiss\|takedown\|block }` |
| PUT | `/settings` | `{ individualListingLimit, currencyLabel }` |
| POST/DELETE | `/catalog/makes`, `/models`, `/lookups` | Catalog CRUD |
| GET/POST | `/announcements` | Platform announcements |
| GET/PUT | `/pages`, `/pages/:slug` | CMS |

## Testing admin with curl

Admin routes (except `/api/admin/auth/login` and `/refresh`) require `Authorization: Bearer <accessToken>`. A bare curl copied from DevTools will return **401** without that header.

```bash
# 1. Login (password from backend/.env SUPER_ADMIN_PASSWORD)
curl -s -X POST 'http://localhost:4000/api/admin/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tchadvoiture.local","password":"YOUR_PASSWORD"}'

# 2. Use accessToken from the JSON response
curl -s 'http://localhost:4000/api/admin/users?role=&q=' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Via the Vite dev proxy, use port **5173** instead of **4000** for `/api/...` paths.

## Smoke tests

```bash
npm run seed && npm run seed:demo
npm run test:api
```

Covers 69 checks across the routes above (see `scripts/api-smoke.mjs`).
