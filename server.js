const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());

// CORS abierto por ahora (podemos restringir dominios luego)
app.use(cors());

// Health checks unificados
app.get(['/hc', '/_health'], (_req, res) => res.status(200).send('ok'));

// API
const ordersRouter = require('./routes/orders');
app.use('/api/orders', ordersRouter);

// Raíz
app.get('/', (_req, res) => res.send({ message: 'Base OK: Node + Express listo para Cloud Run' }));

const PORT = process.env.PORT || 8080; // Cloud Run usa 8080
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
