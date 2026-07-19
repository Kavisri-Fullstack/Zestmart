const { Address } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/addresses
 * Always scoped to the logged-in user — there is no way to list
 * another user's addresses through this endpoint.
 */
const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort('-isDefault -createdAt');
  res.status(200).json(new ApiResponse(200, { addresses }, 'Addresses fetched successfully'));
});

/**
 * POST /api/v1/addresses
 */
const createAddress = asyncHandler(async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user._id });
  res.status(201).json(new ApiResponse(201, { address }, 'Address added successfully'));
});

/**
 * PATCH /api/v1/addresses/:id
 * Owner only — findOneAndUpdate with a `user` filter means a request
 * for someone else's address _id simply returns "not found" rather
 * than leaking whether that address exists.
 */
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
  }

  Object.assign(address, req.body);
  await address.save(); // triggers the pre-save hook that un-defaults other addresses

  res.status(200).json(new ApiResponse(200, { address }, 'Address updated successfully'));
});

/**
 * DELETE /api/v1/addresses/:id
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully'));
});

/**
 * PATCH /api/v1/addresses/:id/default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
  }

  address.isDefault = true;
  await address.save(); // pre-save hook un-defaults every other address for this user

  res.status(200).json(new ApiResponse(200, { address }, 'Default address updated successfully'));
});

module.exports = { getMyAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };
