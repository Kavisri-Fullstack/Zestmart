const express = require('express');
const {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');
const validate = require('../middlewares/validate');
const {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} = require('../validators/address.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Every address route requires a logged-in user.
router.use(protect);

// GET /api/v1/addresses
router.get('/', getMyAddresses);

// POST /api/v1/addresses
router.post('/', validate(createAddressSchema), createAddress);

// PATCH /api/v1/addresses/:id
router.patch('/:id', validate(updateAddressSchema), updateAddress);

// DELETE /api/v1/addresses/:id
router.delete('/:id', validate(addressIdParamSchema), deleteAddress);

// PATCH /api/v1/addresses/:id/default
router.patch('/:id/default', validate(addressIdParamSchema), setDefaultAddress);

module.exports = router;
