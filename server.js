// server.js (mínimo y estable)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const wooWebhook = require('./routes/webhooks/woo');
const { verifyIdToken, requireRole } = require('./src/middleware/auth');
const ordersRouter = require('./routes/orders');
const orderActions = require('./routes/orderActions');
const adminUsers = require('./routes/adminUsers');
const debugRouter = require('./routes/debug');

const app = express();

// 4) Seguridad y configuración base (antes de rutas normales)
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allow = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    return cb(null, !origin || allow.includes(origin));
  },
  credentials: true
}));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

// 1) Ruta de salud (debe responder de inmediato)
app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'));

// 2) Montar webhook de Woo con raw body ANTES del json global
app.use('/webhooks/woo', express.raw({ type: 'application/json' }), wooWebhook);

// 3) Ahora sí, el body parser global para el resto de rutas
app.use(express.json({ limit: '1mb' }));

// 5) Rutas de órdenes (lectura pública por ahora; si quieres, movemos detrás de verifyIdToken)
app.use('/api/orders', verifyIdToken, ordersRouter);
app.use('/api/debug', debugRouter);

// 6) Protege acciones sobre órdenes (crear/actualizar/borrar status, etc.)
app.use('/api/orders', verifyIdToken, orderActions);

// 7) Protege admin (crear usuarios y asignar claims)
app.use('/api/admin', verifyIdToken, requireRole('admin'), express.json(), adminUsers);

// Monta debug sin prefijo (todas las rutas definidas en routes/debug.js)
app.use(require('./routes/debug'));

// Monta rutas de desarrollo/seed
app.use(require('./routes/dev.seed'));

// Monta rutas de pruebas QA
app.use(require('./routes/orders.qa'));

// (opcional futuro) otras rutas

// Arrancar servidor
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});