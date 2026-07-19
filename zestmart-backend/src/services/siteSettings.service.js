const { SiteSettings } = require('../models');

/**
 * Returns the one-and-only SiteSettings document, creating it with
 * defaults on first-ever call. Every read/write in the app goes through
 * this function rather than querying SiteSettings directly, so the
 * "singleton" guarantee lives in one place.
 */
const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne({ singletonKey: 'main' });
  if (!settings) {
    settings = await SiteSettings.create({ singletonKey: 'main' });
  }
  return settings;
};

module.exports = { getOrCreateSettings };
