// src/middleware/auth.js
const { admin } = require('../services/db');

async function verifyIdToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: 'missing_token' });
    const token = m[1];

    const decoded = await admin.auth().verifyIdToken(token, true);
    req.user = decoded; // <-- role y tenantId vienen AQUÍ en top-level
    return next();
  } catch (e) {
    console.error('[auth] invalid token', e.message);
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    // Los custom claims vienen en el token decodificado en top-level (p.ej., decoded.role)
    const userRole = req.user?.role || req.user?.claims?.role; // fallback por si alguien adjuntó diferente
    if (userRole !== role) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}

module.exports = { verifyIdToken, requireRole };
