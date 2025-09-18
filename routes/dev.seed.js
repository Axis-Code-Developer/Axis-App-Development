// routes/dev.seed.js
const express = require('express');
const { db } = require('../src/services/db');
const { verifyIdToken, requireRole } = require('../src/middleware/auth');

const router = express.Router();

router.post('/api/dev/seed-order',
  verifyIdToken,              // <-- primero autenticar
  requireRole('admin'),       // <-- luego exigir rol
  async (req, res) => {
    try {
      const { id = String(Date.now()), total = 24.9, status = 'pending' } = req.body || {};
      const now = Date.now();

      await db.collection('orders').doc(String(id)).set({
        tenantId: req.user?.tenantId || 'axis',
        platform: 'woo',
        storeId: 'default',
        platformOrderId: String(id),
        currency: 'USD',
        total: Number(total),
        status,
        createdAt: now,
        updatedAt: now,
        sourceLastUpdate: 'api',
        source: 'dev-seed',
        items: [],
        customer: { name: '', email: '', phone: '' }
      }, { merge: true });

      return res.json({ ok: true, id: String(id) });
    } catch (e) {
      console.error('seed-order error:', e);
      return res.status(500).json({ ok: false, error: 'internal_error' });
    }
  }
);

module.exports = router;