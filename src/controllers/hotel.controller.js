const hotelService = require('../services/hotel.service');

const searchHotels = async (req, res, next) => {
  try {
    const { city, checkIn, checkOut, guests } = req.query;

    if (!city || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ success: false, message: 'City, checkIn, checkOut, and guests are required' });
    }

    const hotels = await hotelService.searchHotels(city, checkIn, checkOut, guests);

    res.status(200).json({
      success: true,
      data: hotels
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchHotels };
