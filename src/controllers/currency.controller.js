const currencyService = require('../services/currency.service');

const convert = async (req, res, next) => {
  try {
    const { amount, from, to } = req.query;
    const result = await currencyService.convert(amount, from, to);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const supported = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { currencies: currencyService.SUPPORTED, enabled: currencyService.isConfigured() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { convert, supported };
