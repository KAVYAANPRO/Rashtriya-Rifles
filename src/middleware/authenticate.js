const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');
module.exports = async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  try {
    const payload = verifyToken(header.split(' ')[1]);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, isPremium: true } });
    if (!user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    req.user = { id: user.id, email: user.email, isPremium: user.isPremium };
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};

