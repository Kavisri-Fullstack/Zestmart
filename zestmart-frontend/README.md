# ZestMart Frontend

A complete React + Vite + Tailwind storefront and admin dashboard built against the
ZestMart backend API (`/api/v1`), matching the routes, response shapes, and auth flow
defined in `src/docs/openapi.js` in the backend repo.

## What's included

**Storefront:** home page, product listing with filters/search/sort/pagination, product
detail with gallery + reviews, cart, wishlist, checkout (address, coupon, COD or
Razorpay), order history + order tracking + invoice download, login/register/forgot
password (OTP flow), profile & saved addresses, support tickets.

**Admin dashboard** (role: `admin`): stats + sales chart, product CRUD (with image
upload), category CRUD, order management (status/tracking updates), coupon CRUD,
banner CRUD, user management (block/unblock).

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` (already present) and point it at your backend:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Make sure your **backend's** `CLIENT_URL` env var is set to `http://localhost:5173`
(Vite's default port) so CORS + the auth cookie work correctly — this project already
expects that based on your backend's `.env.example`.

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Auth notes

- Access tokens are kept in memory (not localStorage) and attached via an axios
  interceptor. The refresh token lives in an httpOnly cookie set by the backend, so
  `withCredentials: true` is set on every request.
- On a 401, the client automatically calls `POST /auth/refresh-token` once and retries
  the original request before giving up and logging the user out.

## Getting admin access

Your uploaded backend references an `npm run seed` script, but the `src/seed/` folder
wasn't included in the zip you shared — so there's no ready-made admin account. Easiest
path: register a normal account through the app, then in MongoDB set that user's `role`
field to `"admin"` (e.g. via `mongosh` or Compass: `db.users.updateOne({email: "you@x.com"}, {$set: {role: "admin"}})`).
Once that's done, log out and back in — the "Admin dashboard" link will appear in the
profile menu, and `/admin` becomes accessible.

## Payments

Checkout supports Cash on Delivery out of the box. For Razorpay, the frontend loads
`checkout.js` and calls `POST /payments/create-order` then `POST /orders` with the
returned signature fields — this will only work once your backend's Razorpay test keys
are configured.

## Notes

- Built for your backend's exact response envelope: `{ success, message, data, meta }`.
- Pagination follows your `ApiFeatures` shape (`page`, `limit`, `total`, `totalPages`).
- No backend code was modified — this is a standalone frontend.
