const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Sign in required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'globetrotter-hackathon-secret-change-me');
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
};
