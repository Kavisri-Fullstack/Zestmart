/**
 * Hand-written OpenAPI 3.0 specification for the entire ZestMart API.
 *
 * Why hand-written instead of JSDoc-comment generation (swagger-jsdoc)?
 * With 100+ endpoints spread across 25+ route files, scattering JSDoc
 * blocks through every route would be harder to keep consistent and
 * harder to review in one sitting. A single spec file is the source of
 * truth for documentation, kept deliberately close to (but not a
 * duplicate of) the real Zod validators — field-level validation rules
 * still live only in the validators; this file documents shapes and
 * behavior for API consumers (like a frontend developer or Postman).
 *
 * Served at GET /api-docs via swagger-ui-express (see app.js).
 */

const env = require('../config/env');

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

const successResponse = (description, dataSchema) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          dataSchema ? { properties: { data: dataSchema } } : {},
        ],
      },
    },
  },
});

const paginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
];

const bearerAuth = [{ bearerAuth: [] }];

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ZestMart API',
    version: '1.0.0',
    description:
      'Premium Indian lifestyle ecommerce platform — REST API covering ' +
      'Auth, Catalog, Cart/Wishlist, Orders/Payments, Reviews, Coupons, ' +
      'Notifications, Banners, Search/Recommendations, Support, and Admin.\n\n' +
      'All endpoints are versioned under `/api/v1`. Authenticated endpoints ' +
      'expect `Authorization: Bearer <accessToken>`. The refresh token is ' +
      'handled via an httpOnly cookie and is not part of the request body ' +
      'for any endpoint.',
    contact: { name: 'ZestMart Engineering' },
  },
  servers: [{ url: `${env.serverUrl}/api/${env.apiVersion}`, description: 'Current environment' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Categories' },
    { name: 'Products' },
    { name: 'Admin - Categories' },
    { name: 'Admin - Products' },
    { name: 'Cart' },
    { name: 'Wishlist' },
    { name: 'Orders' },
    { name: 'Admin - Orders' },
    { name: 'Payments' },
    { name: 'Reviews' },
    { name: 'Coupons' },
    { name: 'Admin - Coupons' },
    { name: 'Notifications' },
    { name: 'Banners' },
    { name: 'Admin - Banners' },
    { name: 'Addresses' },
    { name: 'Search & Recommendations' },
    { name: 'Uploads' },
    { name: 'Admin - Users' },
    { name: 'Admin - Dashboard & Analytics' },
    { name: 'Support Tickets' },
    { name: 'Admin - Support Tickets' },
    { name: 'Sessions' },
    { name: 'Site Settings' },
    { name: 'Admin - Activity Logs' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
          meta: { type: 'object', nullable: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['user', 'admin'] },
          status: { type: 'string', enum: ['active', 'blocked'] },
          isEmailVerified: { type: 'boolean' },
          avatar: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          image: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          sortOrder: { type: 'number' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          slug: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'number' },
          category: { type: 'string' },
          images: { type: 'array', items: { type: 'object' } },
          ratingAverage: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          orderNumber: { type: 'string', example: 'ZM20260709001' },
          invoiceNumber: { type: 'string', example: 'INV20260709001' },
          items: { type: 'array', items: { type: 'object' } },
          subtotal: { type: 'number' },
          discountAmount: { type: 'number' },
          couponCode: { type: 'string', nullable: true },
          shippingFee: { type: 'number' },
          totalAmount: { type: 'number' },
          paymentMethod: { type: 'string', enum: ['cod', 'razorpay'] },
          paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
          orderStatus: {
            type: 'string',
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
        },
      },
      Coupon: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          code: { type: 'string', example: 'WELCOME20' },
          type: { type: 'string', enum: ['percentage', 'flat'] },
          value: { type: 'number' },
          minOrderAmount: { type: 'number' },
          maxDiscountAmount: { type: 'number', nullable: true },
          usageLimit: { type: 'number', nullable: true },
          usedCount: { type: 'number' },
          isActive: { type: 'boolean' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      Address: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          label: { type: 'string' },
          fullName: { type: 'string' },
          phone: { type: 'string' },
          line1: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' },
          isDefault: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'API + database health check',
        responses: { 200: successResponse('Healthy'), 503: errorResponse('Database unreachable') },
      },
    },

    // ---------------- AUTH ----------------
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Kavisri' },
                  email: { type: 'string', example: 'kavisri@example.com' },
                  password: { type: 'string', example: 'Test@1234' },
                  phone: { type: 'string', example: '+919876543210' },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse('Account created', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' }, accessToken: { type: 'string' } },
          }),
          409: errorResponse('Email already exists'),
          422: errorResponse('Validation failed'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email + password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: successResponse('Login successful'),
          401: errorResponse('Invalid credentials'),
          404: errorResponse('No account found'),
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in (or register) with a Google ID token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['idToken'], properties: { idToken: { type: 'string' } } },
            },
          },
        },
        responses: { 200: successResponse('Signed in'), 401: errorResponse('Invalid Google token') },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate the refresh-token cookie for a new access token',
        responses: { 200: successResponse('New access token issued'), 401: errorResponse('No/invalid refresh token') },
      },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Log out (clears cookie, revokes session)', responses: { 200: successResponse('Logged out') } },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password-reset OTP by email',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } },
        },
        responses: { 200: successResponse('Generic success message (no user enumeration)') },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify a 6-digit OTP for signup verification or password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'purpose'],
                properties: {
                  email: { type: 'string' },
                  code: { type: 'string', example: '042817' },
                  purpose: { type: 'string', enum: ['signup_verification', 'password_reset'] },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse('Verified (returns resetToken for password_reset)'),
          400: errorResponse('OTP invalid, expired, or max attempts reached'),
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Set a new password using a resetToken from verify-otp',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resetToken', 'newPassword'],
                properties: { resetToken: { type: 'string' }, newPassword: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: successResponse('Password reset'), 401: errorResponse('Invalid/expired reset token') },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        security: bearerAuth,
        responses: { 200: successResponse('Current user', { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } }) },
      },
    },

    // ---------------- CATEGORIES ----------------
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List active categories',
        responses: { 200: successResponse('Categories', { type: 'object', properties: { categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } }) },
      },
    },
    '/categories/{slug}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: successResponse('Category'), 404: errorResponse('Not found') },
      },
    },
    '/categories/{slug}/products': {
      get: {
        tags: ['Categories'],
        summary: 'List products in a category',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }, ...paginationParams],
        responses: { 200: successResponse('Products') },
      },
    },

    // ---------------- ADMIN CATEGORIES ----------------
    '/admin/categories': {
      post: {
        tags: ['Admin - Categories'],
        summary: 'Create a category (multipart/form-data, field "image")',
        security: bearerAuth,
        responses: { 201: successResponse('Created'), 409: errorResponse('Name already exists') },
      },
    },
    '/admin/categories/{id}': {
      patch: { tags: ['Admin - Categories'], summary: 'Update a category', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } },
      delete: { tags: ['Admin - Categories'], summary: 'Delete a category (blocked if products/children reference it)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Deleted'), 409: errorResponse('In use') } },
    },

    // ---------------- PRODUCTS ----------------
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List/search/filter/sort products',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'e.g. price or -price' },
          ...paginationParams,
        ],
        responses: { 200: successResponse('Products', { type: 'array', items: { $ref: '#/components/schemas/Product' } }) },
      },
    },
    '/products/featured': { get: { tags: ['Products'], summary: 'Featured products', responses: { 200: successResponse('Products') } } },
    '/products/trending': { get: { tags: ['Products'], summary: 'Trending products', responses: { 200: successResponse('Products') } } },
    '/products/bestsellers': { get: { tags: ['Products'], summary: 'Best sellers', responses: { 200: successResponse('Products') } } },
    '/products/new-arrivals': { get: { tags: ['Products'], summary: 'New arrivals', responses: { 200: successResponse('Products') } } },
    '/products/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by slug (tracks recently-viewed if logged in)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: successResponse('Product', { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } }), 404: errorResponse('Not found') },
      },
    },
    '/products/{id}/related': {
      get: { tags: ['Products'], summary: 'Related products (same category)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Products') } },
    },

    // ---------------- ADMIN PRODUCTS ----------------
    '/admin/products': {
      post: { tags: ['Admin - Products'], summary: 'Create a product (multipart/form-data, field "images", up to 10)', security: bearerAuth, responses: { 201: successResponse('Created'), 409: errorResponse('Title exists'), 400: errorResponse('Invalid category') } },
      get: { tags: ['Admin - Products'], summary: 'List all products (including inactive)', security: bearerAuth, parameters: paginationParams, responses: { 200: successResponse('Products') } },
    },
    '/admin/products/{id}': {
      get: { tags: ['Admin - Products'], summary: 'Get product by id', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Product') } },
      patch: { tags: ['Admin - Products'], summary: 'Update a product', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } },
      delete: { tags: ['Admin - Products'], summary: 'Delete a product (cleans up Cloudinary images)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Deleted') } },
    },
    '/admin/products/{id}/stock': {
      patch: {
        tags: ['Admin - Products'],
        summary: 'Update stock only',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { stock: { type: 'number' } } } } } },
        responses: { 200: successResponse('Stock updated'), 422: errorResponse('Invalid stock value') },
      },
    },

    // ---------------- CART ----------------
    '/cart': {
      get: { tags: ['Cart'], summary: "Get the caller's cart (auto-syncs against live product data)", security: bearerAuth, responses: { 200: successResponse('Cart') } },
      delete: { tags: ['Cart'], summary: 'Clear the entire cart', security: bearerAuth, responses: { 200: successResponse('Cleared') } },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add an item to the cart',
        security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['productId'], properties: { productId: { type: 'string' }, quantity: { type: 'integer', default: 1 }, variant: { type: 'string' } } } } } },
        responses: { 200: successResponse('Cart updated'), 400: errorResponse('Insufficient stock'), 404: errorResponse('Product not found') },
      },
    },
    '/cart/items/{productId}': {
      patch: { tags: ['Cart'], summary: 'Update quantity of a cart item', security: bearerAuth, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated'), 404: errorResponse('Not in cart') } },
      delete: { tags: ['Cart'], summary: 'Remove an item from the cart', security: bearerAuth, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Removed') } },
    },

    // ---------------- WISHLIST ----------------
    '/wishlist': { get: { tags: ['Wishlist'], summary: "Get the caller's wishlist", security: bearerAuth, responses: { 200: successResponse('Wishlist') } } },
    '/wishlist/items': {
      post: { tags: ['Wishlist'], summary: 'Add a product to wishlist (no-op if already saved)', security: bearerAuth, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['productId'], properties: { productId: { type: 'string' }, note: { type: 'string' } } } } } }, responses: { 200: successResponse('Added') } },
    },
    '/wishlist/items/{productId}': {
      delete: { tags: ['Wishlist'], summary: 'Remove a product from wishlist', security: bearerAuth, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Removed') } },
    },

    // ---------------- ORDERS ----------------
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place an order from the current cart (checkout)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['addressId', 'paymentMethod'],
                properties: {
                  addressId: { type: 'string' },
                  paymentMethod: { type: 'string', enum: ['cod', 'razorpay'] },
                  couponCode: { type: 'string', example: 'WELCOME20' },
                  notes: { type: 'string' },
                  razorpayOrderId: { type: 'string' },
                  razorpayPaymentId: { type: 'string' },
                  razorpaySignature: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse('Order placed', { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' } } }),
          400: errorResponse('Cart empty / insufficient stock / coupon exhausted'),
          401: errorResponse('Payment verification failed'),
        },
      },
      get: {
        tags: ['Orders'],
        summary: "List the caller's own orders",
        security: bearerAuth,
        parameters: [...paginationParams, { name: 'orderStatus', in: 'query', schema: { type: 'string' } }],
        responses: { 200: successResponse('Orders') },
      },
    },
    '/orders/{id}': { get: { tags: ['Orders'], summary: 'Get order by id (owner or admin)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Order'), 404: errorResponse('Not found') } } },
    '/orders/{id}/cancel': { patch: { tags: ['Orders'], summary: 'Cancel an order (restores stock + coupon usage, attempts refund)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Cancelled'), 400: errorResponse('Not cancellable') } } },
    '/orders/{id}/track': { get: { tags: ['Orders'], summary: 'Get order status timeline', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Timeline') } } },
    '/orders/{id}/invoice': {
      get: {
        tags: ['Orders'],
        summary: 'Download a PDF invoice (or ?format=json for structured data)',
        security: bearerAuth,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['pdf', 'json'], default: 'pdf' } },
        ],
        responses: {
          200: { description: 'PDF file (application/pdf) or JSON invoice, depending on ?format', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
        },
      },
    },

    // ---------------- ADMIN ORDERS ----------------
    '/admin/orders': { get: { tags: ['Admin - Orders'], summary: 'List all orders', security: bearerAuth, parameters: [...paginationParams, { name: 'orderStatus', in: 'query', schema: { type: 'string' } }, { name: 'paymentStatus', in: 'query', schema: { type: 'string' } }], responses: { 200: successResponse('Orders') } } },
    '/admin/orders/{id}/status': { patch: { tags: ['Admin - Orders'], summary: 'Update order status/tracking number', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } } },
    '/admin/orders/{id}/refund': { patch: { tags: ['Admin - Orders'], summary: 'Refund a paid order via Razorpay', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Refunded'), 400: errorResponse('Not paid / no payment record') } } },

    // ---------------- PAYMENTS ----------------
    '/payments/create-order': { post: { tags: ['Payments'], summary: 'Create a Razorpay order sized to the live cart total', security: bearerAuth, responses: { 201: successResponse('Razorpay order created') } } },
    '/payments/verify': { post: { tags: ['Payments'], summary: 'Standalone signature verification (convenience check)', security: bearerAuth, responses: { 200: successResponse('Verified'), 401: errorResponse('Verification failed') } } },
    '/payments/webhook': { post: { tags: ['Payments'], summary: 'Razorpay server-to-server webhook (not user-authenticated; verified via signature header)', responses: { 200: successResponse('Processed'), 401: errorResponse('Invalid webhook signature') } } },
    '/payments/{orderId}': { get: { tags: ['Payments'], summary: 'Get the payment record for an order', security: bearerAuth, parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Payment') } } },

    // ---------------- REVIEWS ----------------
    '/products/{productId}/reviews': {
      get: { tags: ['Reviews'], summary: 'List a product\'s visible reviews', parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }, ...paginationParams], responses: { 200: successResponse('Reviews') } },
      post: { tags: ['Reviews'], summary: 'Submit a review (one per user per product)', security: bearerAuth, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['rating'], properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } } } } } }, responses: { 201: successResponse('Created'), 409: errorResponse('Already reviewed') } },
    },
    '/reviews/{id}': {
      patch: { tags: ['Reviews'], summary: 'Edit your own review', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated'), 403: errorResponse('Not your review') } },
      delete: { tags: ['Reviews'], summary: 'Delete your own review (or any, as admin)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Deleted') } },
    },

    // ---------------- COUPONS ----------------
    '/coupons/active': { get: { tags: ['Coupons'], summary: 'List currently-active coupons', responses: { 200: successResponse('Coupons', { type: 'object', properties: { coupons: { type: 'array', items: { $ref: '#/components/schemas/Coupon' } } } }) } } },
    '/coupons/validate': { post: { tags: ['Coupons'], summary: 'Validate a coupon against a cart total', security: bearerAuth, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code', 'cartTotal'], properties: { code: { type: 'string' }, cartTotal: { type: 'number' } } } } } }, responses: { 200: successResponse('Valid, with discountAmount'), 400: errorResponse('Min order not met / expired'), 404: errorResponse('Not found') } } },

    // ---------------- ADMIN COUPONS ----------------
    '/admin/coupons': {
      post: { tags: ['Admin - Coupons'], summary: 'Create a coupon', security: bearerAuth, responses: { 201: successResponse('Created'), 409: errorResponse('Code exists') } },
      get: { tags: ['Admin - Coupons'], summary: 'List all coupons', security: bearerAuth, responses: { 200: successResponse('Coupons') } },
    },
    '/admin/coupons/{id}': {
      patch: { tags: ['Admin - Coupons'], summary: 'Update a coupon', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } },
      delete: { tags: ['Admin - Coupons'], summary: 'Disable (or ?hard=true to delete) a coupon', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Disabled/Deleted') } },
    },

    // ---------------- NOTIFICATIONS ----------------
    '/notifications': { get: { tags: ['Notifications'], summary: "List the caller's notifications", security: bearerAuth, parameters: [...paginationParams, { name: 'isRead', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } }], responses: { 200: successResponse('Notifications') } } },
    '/notifications/read-all': { patch: { tags: ['Notifications'], summary: 'Mark all as read', security: bearerAuth, responses: { 200: successResponse('Marked') } } },
    '/notifications/{id}/read': { patch: { tags: ['Notifications'], summary: 'Mark one as read', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Marked') } } },
    '/notifications/{id}': { delete: { tags: ['Notifications'], summary: 'Delete a notification', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Deleted') } } },

    // ---------------- BANNERS ----------------
    '/banners': { get: { tags: ['Banners'], summary: 'List currently-live banners', parameters: [{ name: 'position', in: 'query', schema: { type: 'string' } }], responses: { 200: successResponse('Banners') } } },

    // ---------------- ADMIN BANNERS ----------------
    '/admin/banners': {
      post: { tags: ['Admin - Banners'], summary: 'Create a banner (multipart/form-data, fields "image" + optional "mobileImage")', security: bearerAuth, responses: { 201: successResponse('Created'), 400: errorResponse('Image required') } },
      get: { tags: ['Admin - Banners'], summary: 'List all banners', security: bearerAuth, responses: { 200: successResponse('Banners') } },
    },
    '/admin/banners/{id}': {
      patch: { tags: ['Admin - Banners'], summary: 'Update a banner', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } },
      delete: { tags: ['Admin - Banners'], summary: 'Delete a banner (cleans up Cloudinary images)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Deleted') } },
    },

    // ---------------- ADDRESSES ----------------
    '/addresses': {
      get: { tags: ['Addresses'], summary: "List the caller's addresses", security: bearerAuth, responses: { 200: successResponse('Addresses', { type: 'object', properties: { addresses: { type: 'array', items: { $ref: '#/components/schemas/Address' } } } }) } },
      post: { tags: ['Addresses'], summary: 'Add a new address', security: bearerAuth, responses: { 201: successResponse('Created') } },
    },
    '/addresses/{id}': {
      patch: { tags: ['Addresses'], summary: 'Update an address', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } },
      delete: { tags: ['Addresses'], summary: 'Delete an address', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Deleted') } },
    },
    '/addresses/{id}/default': { patch: { tags: ['Addresses'], summary: 'Set as default address', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } } },

    // ---------------- SEARCH & RECOMMENDATIONS ----------------
    '/search/suggestions': { get: { tags: ['Search & Recommendations'], summary: 'Autocomplete suggestions (rate-limited)', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Suggestions') } } },
    '/search/products': { get: { tags: ['Search & Recommendations'], summary: 'Full search results (same engine as GET /products)', parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }, ...paginationParams], responses: { 200: successResponse('Products') } } },
    '/recommendations': { get: { tags: ['Search & Recommendations'], summary: 'Personalized recommendations (AIRecommendation-cached, rule-based fallback)', security: bearerAuth, responses: { 200: successResponse('Products with basis') } } },
    '/recently-viewed': { get: { tags: ['Search & Recommendations'], summary: "Caller's recently-viewed products", security: bearerAuth, responses: { 200: successResponse('Products') } } },

    // ---------------- UPLOADS ----------------
    '/uploads/image': {
      post: { tags: ['Uploads'], summary: 'Upload a single image (multipart, field "image")', security: bearerAuth, responses: { 201: successResponse('Uploaded'), 400: errorResponse('Image required') } },
      delete: { tags: ['Uploads'], summary: 'Delete an image by publicId (admin only)', security: bearerAuth, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { publicId: { type: 'string' } } } } } }, responses: { 200: successResponse('Deleted') } },
    },
    '/uploads/images': { post: { tags: ['Uploads'], summary: 'Upload multiple images (admin only, multipart, field "images")', security: bearerAuth, responses: { 201: successResponse('Uploaded') } } },

    // ---------------- ADMIN USERS ----------------
    '/admin/users': { get: { tags: ['Admin - Users'], summary: 'List/search/filter users', security: bearerAuth, parameters: [...paginationParams, { name: 'role', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'q', in: 'query', schema: { type: 'string' } }], responses: { 200: successResponse('Users') } } },
    '/admin/users/{id}': { get: { tags: ['Admin - Users'], summary: 'Get one user', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('User') } } },
    '/admin/users/{id}/status': { patch: { tags: ['Admin - Users'], summary: 'Block/unblock a user', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'blocked'] } } } } } }, responses: { 200: successResponse('Updated'), 400: errorResponse('Cannot modify self') } } },

    // ---------------- ADMIN DASHBOARD ----------------
    '/admin/dashboard': { get: { tags: ['Admin - Dashboard & Analytics'], summary: 'Summary stats (revenue, orders, users, low stock, recent orders)', security: bearerAuth, responses: { 200: successResponse('Summary') } } },
    '/admin/analytics/sales': { get: { tags: ['Admin - Dashboard & Analytics'], summary: 'Revenue/orders grouped by day', security: bearerAuth, parameters: [{ name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } }, { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }], responses: { 200: successResponse('Sales series') } } },
    '/admin/analytics/products': { get: { tags: ['Admin - Dashboard & Analytics'], summary: 'Top-selling products + stock breakdown', security: bearerAuth, responses: { 200: successResponse('Product analytics') } } },
    '/admin/analytics/users': { get: { tags: ['Admin - Dashboard & Analytics'], summary: 'Signups by day + status breakdown', security: bearerAuth, responses: { 200: successResponse('User analytics') } } },
    '/admin/inventory/low-stock': { get: { tags: ['Admin - Dashboard & Analytics'], summary: 'Products at or below a stock threshold', security: bearerAuth, parameters: [{ name: 'threshold', in: 'query', schema: { type: 'integer', default: 10 } }], responses: { 200: successResponse('Low stock products') } } },

    // ---------------- SUPPORT TICKETS ----------------
    '/support-tickets': {
      post: { tags: ['Support Tickets'], summary: 'Open a new support ticket', security: bearerAuth, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['subject', 'message'], properties: { subject: { type: 'string' }, category: { type: 'string' }, message: { type: 'string' }, orderId: { type: 'string' } } } } } }, responses: { 201: successResponse('Created') } },
      get: { tags: ['Support Tickets'], summary: "List the caller's own tickets", security: bearerAuth, responses: { 200: successResponse('Tickets') } },
    },
    '/support-tickets/{id}': { get: { tags: ['Support Tickets'], summary: 'Get one ticket (owner or admin)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Ticket') } } },
    '/support-tickets/{id}/messages': { post: { tags: ['Support Tickets'], summary: 'Add a message to a ticket', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Message added') } } },

    // ---------------- ADMIN SUPPORT TICKETS ----------------
    '/admin/support-tickets': { get: { tags: ['Admin - Support Tickets'], summary: 'List all tickets', security: bearerAuth, parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'priority', in: 'query', schema: { type: 'string' } }], responses: { 200: successResponse('Tickets') } } },
    '/admin/support-tickets/{id}': { patch: { tags: ['Admin - Support Tickets'], summary: 'Update status/priority/assignment', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Updated') } } },
    '/admin/support-tickets/{id}/messages': { post: { tags: ['Admin - Support Tickets'], summary: 'Reply to a ticket as support', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Replied') } } },

    // ---------------- SESSIONS ----------------
    '/sessions': {
      get: { tags: ['Sessions'], summary: "List the caller's active sessions/devices", security: bearerAuth, responses: { 200: successResponse('Sessions') } },
      delete: { tags: ['Sessions'], summary: 'Revoke all OTHER sessions except the current one', security: bearerAuth, responses: { 200: successResponse('Revoked') } },
    },
    '/sessions/{id}': { delete: { tags: ['Sessions'], summary: 'Revoke one specific session', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successResponse('Revoked'), 404: errorResponse('Not found') } } },

    // ---------------- SITE SETTINGS ----------------
    '/site-settings': { get: { tags: ['Site Settings'], summary: 'Get public site settings (branding, shipping thresholds, maintenance mode)', responses: { 200: successResponse('Settings') } } },
    '/admin/site-settings': { patch: { tags: ['Site Settings'], summary: 'Update site settings', security: bearerAuth, responses: { 200: successResponse('Updated') } } },

    // ---------------- ADMIN ACTIVITY LOGS ----------------
    '/admin/activity-logs': {
      get: {
        tags: ['Admin - Activity Logs'],
        summary: 'View the admin audit trail',
        security: bearerAuth,
        parameters: [...paginationParams, { name: 'admin', in: 'query', schema: { type: 'string' } }, { name: 'action', in: 'query', schema: { type: 'string' } }, { name: 'targetType', in: 'query', schema: { type: 'string' } }],
        responses: { 200: successResponse('Activity logs') },
      },
    },
  },
};

module.exports = openapiSpec;
