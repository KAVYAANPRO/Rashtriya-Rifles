/* eslint-disable no-unused-vars */
module.exports = function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Only shout about genuine server faults; 4xx are expected traffic.
  if (statusCode >= 500) console.error(err);
  else console.warn(`${statusCode} ${req.method} ${req.originalUrl} — ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: err.message || 'Something went wrong',
      statusCode,
    },
  });
};
