# ZestMart Backend

Premium Indian lifestyle ecommerce API. Node.js + Express + MongoDB (Mongoose),
built in MVC architecture, following the ZestMart Master Specification.

**Phase 1 status:** ✅ complete — project skeleton, DB connection, middleware, global error
handling, and health check.

**Phase 2 status:** ✅ complete — Users, Products, Categories, and Addresses
Mongoose models; Zod request validation; Auth APIs (register, login,
refresh-token, logout, me); bcrypt password hashing; JWT access + refresh
token flow; role-based authorization middleware.

**Phase 3 status:** ✅ complete — full Category and Product CRUD (admin,
Cloudinary image upload), public browsing APIs (search, filter, sort,
pagination, featured/trending/bestsellers/new-arrivals, related products),
and slug generation.

**Phase 4 status:** ✅ complete — Cart APIs (get, add item, update item,
remove item, clear cart) and Wishlist APIs (get, add item, remove item).
Cart automatically re-syncs against live product data on every read/write
(price changes, stock drops, deactivated/deleted products), and both
Cart/Wishlist counts stay in sync with the denormalized `cartCount` /
`wishlistCount` fields on the User model.

**Phase 5 status:** ✅ complete — Orders & Checkout APIs (place order,
order history, order detail, cancel, track, invoice) plus Razorpay
Payment APIs (create Razorpay order, verify signature, webhook, payment
lookup). Checkout converts the live cart into a permanent order snapshot,
decrements stock atomically with automatic rollback on partial failure,
and generates sequential human-readable order/invoice numbers
(e.g. `ZM20260709001` / `INV20260709001`). Admin order management
(list all, update status, refund) is included.

**Phase 6 status:** ✅ complete — Reviews & Ratings (one review per user
per product, with automatic product rating aggregation), Coupons
(validate, active list, admin CRUD), Notifications (list, mark
read/all-read, delete — with automatic notifications on order placement
and status changes), Banner management (public + admin CRUD with
Cloudinary uploads), full Address CRUD, Search improvements
(autocomplete suggestions, full search, recently-viewed tracking, simple
rule-based recommendations), and Admin Dashboard Analytics (summary,
sales-over-time, top-selling products, user signups, low-stock report).

**Phase 7 status:** ✅ complete — this closes out every remaining
endpoint from the original spec. Google Sign-In (verified server-side
via `google-auth-library`), OTP-based email verification and
forgot/reset-password flow (bcrypt-hashed codes, rate-limited, auto-
expiring via MongoDB TTL index), standalone Upload APIs
(`/uploads/image`, `/uploads/images`, `DELETE /uploads/image` with a
folder whitelist), and Admin User Management (list/filter/search users,
view one, block/unblock). As of Phase 7, every API in the original
ZestMart Master Specification has been implemented.

**Final (Production) Phase status:** ✅ complete — closes every
remaining functional gap identified after Phase 7:
- **Coupons integrated into checkout** — `POST /orders` accepts
  `couponCode`, validates and applies the discount, and atomically
  increments `usedCount` (a conditional update, so two customers can
  never both claim the last use of a limited coupon); cancelling an
  order atomically gives the usage back.
- **PDF invoices** — `GET /orders/:id/invoice` returns a real
  downloadable PDF by default (via `pdfkit`); pass `?format=json` for
  the old structured-JSON response.
- **Swagger/OpenAPI docs** — the entire API (102 operations across 84
  paths) is documented and browsable at `GET /api-docs`.
- **AIRecommendations collection** — `GET /recommendations` now reads
  from a cached `AIRecommendation` snapshot (invalidated when new
  browsing activity is recorded), falling back to the original
  rule-based logic when no snapshot exists yet.
- **Optional production modules**: Admin Activity Logs (audit trail,
  viewable at `GET /admin/activity-logs`), Support Tickets (user +
  admin), Sessions (per-device refresh-token tracking with remote
  revocation), and Site Settings (a singleton, admin-editable
  branding/config document).

**With this phase, there are no remaining functional gaps against the
original ZestMart Master Specification, and the backend is considered
production-ready.**

---

## Folder Structure

```
zestmart-backend/
├── src/
│   ├── config/          # env loader, DB connection, Cloudinary, Razorpay setup
│   ├── controllers/      # health, auth, category, product controllers
│   ├── middlewares/      # errorHandler, notFound, rateLimiter, auth, validate, upload, markAdminRoute
│   ├── models/           # User, Category, Product, Address (Mongoose schemas)
│   ├── routes/           # health, auth, category, product, admin.category, admin.product, index
│   ├── services/         # cloudinary.service.js (upload/delete)
│   ├── utils/            # ApiError, ApiResponse, asyncHandler, logger, jwt, apiFeatures
│   ├── validators/        # auth, category, product (Zod schemas)
│   ├── app.js            # Express app: middleware + routes wiring (no server.listen here)
│   └── server.js         # boots DB connection, then starts the HTTP server
├── logs/                 # winston log files (error.log, combined.log) — gitignored content
├── .env.example          # template for required environment variables
├── .gitignore
├── package.json
└── README.md
```

### Why this layout

- **config/** centralizes every third-party setup (DB, Cloudinary, Razorpay) and
  the parsed environment variables, so no other file reads `process.env` directly.
- **controllers/** stay thin — they call services/models and shape the response.
- **models/** hold Mongoose schemas only, matching the Database Schema section
  of the spec exactly (Users, Products, Categories, Orders, Carts, Wishlists,
  Reviews, Coupons, Addresses, Notifications, Banners, Payments,
  OTPVerifications, AIRecommendations, RecentlyViewedProducts).
- **routes/** are grouped by resource and mounted under `/api/v1` in
  `routes/index.js`, mirroring the REST API Design section.
- **middlewares/** hold cross-cutting concerns: the global error handler,
  404 handler, and rate limiters. Auth guards (`protect`, `isAdmin`) and
  upload middleware (Multer) will be added here in later phases.
- **utils/** hold small, framework-agnostic helpers used everywhere:
  `ApiError` (throwable errors with status codes), `ApiResponse` (consistent
  success shape), `asyncHandler` (removes try/catch boilerplate), and
  `logger` (Winston, console + file transports).
- **app.js vs server.js** are split on purpose: `app.js` only builds the
  Express app (useful for testing with supertest later, without opening a
  real port); `server.js` is the actual process entrypoint that connects to
  MongoDB, starts listening, and handles graceful shutdown.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill in real values
cp .env.example .env

# 3. Run in development (auto-restarts on file changes)
npm run dev

# 4. Or run in production mode
npm start
```

## Health Check

Once running, confirm everything is wired correctly:

```
GET http://localhost:5000/api/v1/health
```

Response:
```json
{
  "success": true,
  "message": "ZestMart API health check",
  "data": {
    "status": "ok",
    "uptimeSeconds": 12,
    "timestamp": "2026-07-07T04:30:00.000Z",
    "database": "connected"
  }
}
```

Returns HTTP 503 with `"database": "disconnected"` if MongoDB isn't reachable —
useful for uptime monitors and for catching a bad `MONGODB_URI` early.

---

## Environment Variables

See `.env.example` for the full list. At minimum, Phase 1 requires:

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — any long random strings for now
  (real auth logic comes in Phase 2)

The server will refuse to start and print a clear error if these are missing.

---

## Next: Phase 2

Phase 2 will add the Mongoose models (Users, Products, Categories) and the
Auth APIs (register, login, refresh token, OTP verification), following the
Database Schema and Auth API sections of the spec exactly.
