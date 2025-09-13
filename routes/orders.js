const express = require('express');
const router = express.Router();

let ORDERS = [];

router.get('/', (_req, res) => {
  res.json({ items: ORDERS, count: ORDERS.length });
});

router.post('/', (req, res) => {
  const { customer, total } = req.body || {};
  if (!customer || typeof total !== 'number') {
    return res.status(400).json({ error: 'customer (string) and total (number) are required' });
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
