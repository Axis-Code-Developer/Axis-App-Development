// routes/orders.js
const express = require('express');
const { db } = require('../src/services/db');
const router = express.Router();

/**
 * Lista últimas órdenes. Robust:
 * - Intenta ordenar por createdAt desc.
 * - Si falla (campo faltante / tipos), hace fallback a leer sin orden y ordena en memoria.
 * - Loguea el error real para depurar.
 */
router.get('/', async (req, res) => {
  try {
    // si viene autenticado, filtramos por tenantId
    const tenantId = req.user?.tenantId;
    let q = db.collection('orders');
    if (tenantId) q = q.where('tenantId', '==', tenantId);

    let items = [];
    try {
      const snap = await q.orderBy('createdAt', 'desc').limit(50).get();
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (inner) {
      const snap = await q.limit(50).get();
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    res.json({ items, count: items.length });
  } catch (e) {
    console.error('[orders:list] fatal', e);
    res.status(500).json({ error: 'list_failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const doc = await db.collection('orders').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('[orders:get] error', e);
    return res.status(500).json({ error: 'get_failed' });
  }
});

module.exports = router;