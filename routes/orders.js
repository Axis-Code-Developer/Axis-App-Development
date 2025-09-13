cat > routes/orders.js <<'EOF'
const express = require('express');
const { Firestore } = require('@google-cloud/firestore');

const router = express.Router();
const db = new Firestore();
const col = db.collection('orders');

router.get('/', async (_req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').limit(50).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(items);
  } catch {
    res.status(500).json({ error: 'list_failed' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer, total } = req.body || {};
    if (!customer || typeof total !== 'number') return res.status(400).json({ error: 'invalid_payload' });
    const payload = { customer, total, createdAt: new Date().toISOString() };
    const ref = await col.add(payload);
    const data = (await ref.get()).data();
    res.status(201).json({ id: ref.id, ...data });
  } catch {
    res.status(500).json({ error: 'create_failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'not_found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch {
    res.status(500).json({ error: 'get_failed' });
  }
});

module.exports = router;
EOF
