const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Full SQL logging drowns out the request log, so it is opt-in:
//   PRISMA_LOG_QUERIES=true npm run dev
const log = process.env.PRISMA_LOG_QUERIES === 'true'
  ? ['query', 'error', 'warn']
  : ['error', 'warn'];

const prisma = new PrismaClient({ log });

module.exports = prisma;
