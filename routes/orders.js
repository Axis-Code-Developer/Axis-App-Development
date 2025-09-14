const express = require('express');
const { Firestore } = require('@google-cloud/firestore');

const router = express.Router();
const db = new Firestore();
const col = db.collection('orders');

router.get('/', async (_req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').limit(50).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: 'list_failed', details: String(err) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer, total } = req.body || {};
    if (!customer || typeof total !== 'number') {
      return res.status(400).json({ error: 'customer (string) and total (number) are required' });
    }
    const id = `ORD-${Math.floor(Date.now() / 1000)}`;
    const order = { id, customer, total, createdAt: new Date().toISOString() };
    await col.doc(id).set(order);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'create_failed', details: String(err) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const d = await col.doc(req.params.id).get();
    if (!d.exists) return res.status(404).json({ error: 'not_found' });
    res.json(d.data());
  } catch (err) {
    res.status(500).json({ error: 'get_failed', details: String(err) });
  }
});

module.exports = router;
