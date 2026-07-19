require('express-async-errors'); // must be required before routes are used

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middlewares/rateLimiter');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const openapiSpec = require('./docs/openapi');

const app = express();

// Trust the first proxy hop (Render, Vercel, etc. sit behind a load balancer).
// Needed for correct client IPs in rate limiting and secure cookies.
app.set('trust proxy', 1);

// ---------- Security middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(mongoSanitize()); // strips $ and . operators from req.body/query/params
app.use(hpp()); // prevents HTTP parameter pollution
// NOTE: xss-clean is deprecated/unmaintained as of 2026, so it's intentionally
// left out. XSS protection instead comes from: (1) helmet's CSP + security
// headers above, (2) per-field Zod validation on every mutating route
// (Phase 2+), and (3) the frontend escaping output by default (React/JSX).

// ---------- Body parsing ----------
// The `verify` callback stashes the raw request bytes on req.rawBody
// BEFORE JSON parsing. This is required for the Razorpay webhook route
// (POST /api/v1/payments/webhook), whose signature is computed over the
// exact raw bytes Razorpay sent — the parsed/re-stringified JSON would
// not reliably reproduce the same bytes (key order, whitespace, etc.),
// so signature verification would fail intermittently without this.
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ---------- Performance ----------
app.use(compression());

// ---------- Logging ----------
if (!env.isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// ---------- Rate limiting (applies to all /api routes) ----------
app.use(`/api/${env.apiVersion}`, globalLimiter);

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZestMart API is running.',
    docs: `/api/${env.apiVersion}/health`,
    apiDocs: '/api-docs',
  });
});

// Swagger/OpenAPI docs — deliberately mounted OUTSIDE `/api/${apiVersion}`
// (and therefore outside the global rate limiter) since it's a documentation
// UI for developers, not an API endpoint itself. Safe to leave public even
// in production: it describes shapes and behavior, not secrets.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'ZestMart API Docs' }));

app.use(`/api/${env.apiVersion}`, routes);

// ---------- 404 + error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
