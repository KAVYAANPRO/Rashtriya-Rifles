const transportService = require('../services/transport.service');

const searchTransport = async (req, res, next) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    const transportData = await transportService.searchTransport(city);

    res.status(200).json({
      success: true,
      data: transportData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchTransport };
