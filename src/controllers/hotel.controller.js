const hotelService = require('../services/hotel.service');

const searchHotels = async (req, res, next) => {
  try {
    const { city, checkIn, checkOut, guests, adults, children } = req.query;

    const numAdults = adults ? parseInt(adults) : (guests ? parseInt(guests) : 1);
    const numChildren = children ? parseInt(children) : 0;

    if (!city || !checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'City, checkIn, and checkOut are required' });
    }

    const hotels = await hotelService.searchHotels(city, checkIn, checkOut, numAdults, numChildren);

    res.status(200).json({
      success: true,
      data: hotels
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchHotels };
