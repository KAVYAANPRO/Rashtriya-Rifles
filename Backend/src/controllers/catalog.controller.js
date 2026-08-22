const catalogService = require('../services/catalog.service');

const toInt = (value) => {
  if (value === undefined || value === '') return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
};

const toFloat = (value) => {
  if (value === undefined || value === '') return undefined;
  const n = parseFloat(value);
  return Number.isNaN(n) ? undefined : n;
};

const getCities = async (req, res, next) => {
  try {
    const cities = await catalogService.listCities({ search: req.query.search });
    res.status(200).json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
};

const getCityById = async (req, res, next) => {
  try {
    const city = await catalogService.getCity(parseInt(req.params.id, 10));
    res.status(200).json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await catalogService.listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const getActivities = async (req, res, next) => {
  try {
    const activities = await catalogService.listActivities({
      cityId: toInt(req.query.cityId),
      categoryId: toInt(req.query.categoryId),
      categoryName: req.query.category || undefined,
      search: req.query.search || undefined,
      maxCost: toFloat(req.query.maxCost),
      popularOnly: req.query.popular === 'true',
    });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCities, getCityById, getCategories, getActivities };
