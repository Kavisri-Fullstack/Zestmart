# ZestMart

A full-stack e-commerce platform for premium Indian lifestyle products — built end-to-end with a customer storefront, an admin dashboard, and an AI shopping assistant.

🔗 **Live demo:** [zestmart-two.vercel.app](https://zestmart-two.vercel.app)

---

## Features

### Customer store
- Product catalog — 400+ products across 26 categories and sub-categories
- Search, filters, sorting, pagination
- Cart, wishlist, product reviews & ratings
- Checkout with **Razorpay** (online payment) and Cash on Delivery
- Order placement, tracking, and invoice download
- Auth: register/login, JWT access + httpOnly refresh tokens, OTP-based password reset
- Notifications, recently viewed, personalized recommendations
- **AI Shopping Assistant ("Zesty")** — powered by Google Gemini, searches the live product catalog via function-calling to recommend real products (never hallucinated ones)

### Admin dashboard
- Sales analytics and dashboard overview
- Full CRUD: products, categories, orders, coupons, banners, users
- Order status management, site settings, activity logs

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT (access + httpOnly refresh cookie) |
| Payments | Razorpay |
| AI | Google Gemini API (function calling) |
| Image search (seed data) | Pexels API |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## Project structure

```
zestmart/
├── zestmart-backend/     # Express API (REST, /api/v1)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── seed/          # Catalog seed script
│   └── package.json
└── zestmart-frontend/     # React + Vite SPA
    ├── src/
    │   ├── api/            # API client modules
    │   ├── components/
    │   ├── context/        # Auth / Cart / Wishlist state
    │   ├── pages/
    │   └── routes/
    └── package.json
```

---

## Getting started locally

### Backend
```bash
cd zestmart-backend
npm install
# create a .env file — see Environment variables below
npm run seed   # populates categories, products, and an admin account
npm run dev
```

### Frontend
```bash
cd zestmart-frontend
npm install
# create a .env with:
# VITE_API_BASE_URL=http://localhost:5000/api/v1
npm run dev
```

---

## Environment variables (backend)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` / related | JWT signing secrets |
| `CLIENT_URL` | Frontend origin, for CORS |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment gateway |
| `PEXELS_API_KEY` | Used only by the seed script, for catalog images |
| `GEMINI_API_KEY` | Powers the AI shopping assistant |
| `RATE_LIMIT_MAX` | API rate limit window |

---

## Default admin login (after seeding)

```
email: admin@zestmart.com
password: Admin@123
```

---

## License

This project was built for learning and portfolio purposes.
