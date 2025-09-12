const express = require('express');
const router = express.Router();

// Demo en memoria (se reinicia en cada despliegue/instancia)
let ORDERS = [
  { id: 'ORD-1', customer: 'Alice', total: 100, createdAt: new Date().toISOString() }
];

router.get('/', (_req, res) => {
  res.json({ orders: ORDERS });
});

router.post('/', (req, res) => {
  const { customer, total } = req.body || {};
  if (!customer || total == null) {
    return res.status(400).json({ error: 'customer y total son requeridos' });
  }
  const id = `ORD-${ORDERS.length + 1}`;
  const order = { id, customer, total, createdAt: new Date().toISOString() };
  ORDERS.push(order);
  res.status(201).json(order);
});

router.get('/:id', (req, res) => {
  const o = ORDERS.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  res.json(o);
});

module.exports = router;
