const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/v1/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/catalog', require('./routes/catalog.routes'));
app.use('/api/v1/currency', require('./routes/currency.routes'));
app.use('/api/v1/trips', require('./routes/trip.routes'));
app.use('/api/v1/public', require('./routes/public.routes'));
app.use('/api/v1/flights', require('./routes/flight.routes'));
app.use('/api/v1/hotels', require('./routes/hotel.routes'));
app.use('/api/v1/transport', require('./routes/transport.routes'));
app.use('/api/v1/payment', require('./routes/payment.routes'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.originalUrl}`, statusCode: 404 },
  });
});

app.use(errorHandler);

module.exports = app;
