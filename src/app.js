const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// We will mount routes here as we build them in Phase 1 and 2
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/trips', require('./routes/trip.routes'));
app.use('/api/v1/public', require('./routes/public.routes'));
app.use('/api/v1/flights', require('./routes/flight.routes'));
app.use('/api/v1/hotels', require('./routes/hotel.routes'));
app.use('/api/v1/transport', require('./routes/transport.routes'));
app.use('/api/v1/payment', require('./routes/payment.routes'));

app.use(errorHandler);

module.exports = app;
