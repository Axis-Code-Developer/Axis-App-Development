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
app.use(cors());

// Endpoints de salud unificados
app.get(['/hc', '/_health', '/healthz'], (_req, res) => res.status(200).send('ok'));

// Raíz
app.get('/', (_req, res) => res.send({ message: 'Base OK: Node + Express listo para Cloud Run' }));

const PORT = process.env.PORT || 3000; // En Cloud Run será 8080
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
