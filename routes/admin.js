// routes/admin.js
const express = require('express');
const { fetchOrdersSince } = require('../src/services/woo.api');
const { normalizeOrder } = require('../src/platforms/woo.adapter');
const { saveOrder } = require('../src/services/ingest');

const router = express.Router();

router.post('/reconcile', async (req, res) => {
  try {
    const sinceIso = req.body?.since || new Date(Date.now() - 1000*60*60).toISOString(); // 1h por defecto
    const list = await fetchOrdersSince(sinceIso);
    let count = 0;
    for (const raw of Array.isArray(list) ? list : []) {
      const o = normalizeOrder(raw);
      await saveOrder({ ...o, sourceLastUpdate: 'woo' });
      count++;
    }
    res.json({ ok: true, imported: count });
  } catch (e) {
    console.error('[admin:reconcile] error', e);
    res.status(500).json({ error: 'reconcile_failed' });
  }
});

module.exports = router;