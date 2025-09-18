const express = require('express');
const { db } = require('../src/services/db');
const { verifyIdToken } = require('../src/middleware/auth');
const { getWooOrder } = require('../src/platforms/woo.api');
const router = express.Router();

async function resolveWooCfg(db, req) {
  const tenantId = req.user?.tenantId || 'axis';
  const snap = await db.collection('tenants').doc(tenantId).get();
  return snap.exists && snap.data().woo ? snap.data().woo : {
    baseUrl: process.env.WOO_BASE_URL, ck: process.env.WOO_CK, cs: process.env.WOO_CS
  };
}

router.get('/api/orders/:id/woo', verifyIdToken, async (req, res) => {
  try {
    const cfg = await resolveWooCfg(db, req);
    const r = await getWooOrder(cfg, String(req.params.id));
    return res.json(r);
  } catch (e) {
    return res.status(404).json({ ok:false, error: e.message });
  }
});

module.exports = router;
