// routes/orderActions.js
const express = require('express');
const { db } = require('../src/services/db');
const { getWooOrder, updateWooOrderStatus } = require('../src/platforms/woo.api');
const router = express.Router();

/**
 * Resuelve cfg por tenant (claims) con fallback a .env
 */
async function resolveWooCfg(db, req) {
  const tenantId = req.user?.tenantId || 'default';
  try {
    const snap = await db.collection('tenants').doc(tenantId).get();
    if (snap.exists && snap.data()?.woo) {
      // Estructura esperada: tenants/{tenantId}.woo = { baseUrl, ck, cs }
      return snap.data().woo;
    }
  } catch (_) {
    // no-op: caerá al fallback .env
  }
  // Fallback a variables de entorno
  return {
    baseUrl: process.env.WOO_BASE_URL,
    ck: process.env.WOO_CK,
    cs: process.env.WOO_CS,
  };
}

// helper: solo sincroniza si el switch está encendido
function shouldSyncWoo(cfg) {
  return process.env.WOO_SYNC === '1' || cfg?.sync === true;
}

router.patch('/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status_required' });

    const cfg = await resolveWooCfg(db, req);

    // 1) Firestore (asegura campos base si no existe)
    const ref = db.collection('orders').doc(id);
    let prev = 'pending';
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      prev = snap.exists ? (snap.data().status || 'pending') : 'pending';
      const base = snap.exists ? {} : {
        tenantId: req.user?.tenantId || 'axis',
        platform: 'woo',
        storeId: 'default',
        platformOrderId: id,
        currency: 'USD',
        total: 0,
        createdAt: Date.now(),
        items: [],
        customer: { name: '', email: '', phone: '' },
      };
      tx.set(ref, {
        ...base,
        status,
        updatedAt: Date.now(),
        sourceLastUpdate: 'api',
      }, { merge: true });
    });

    // 2) Woo (REAL) — sólo si switch activo
    if (shouldSyncWoo(cfg)) {
      const snap = await ref.get();
      const doc = snap.data();
      const remoteId = String(doc?.platformOrderId || id);

      // preflight: confirma que existe en Woo, si 404 no intenta update
      await getWooOrder(cfg, remoteId);

      await updateWooOrderStatus(cfg, remoteId, status);

      // marca sincronizado
      await ref.set({
        syncStatus: 'in_sync',
        lastSyncedAt: Date.now(),
      }, { merge: true });
    }

    return res.json({ ok: true, id, status });
  } catch (e) {
    console.error('PATCH /orders/:id/status', e?.message || e);
    if (e.code === 'INVALID_STATUS' || e.code === 'STATUS_REQUIRED' || e.code === 'ORDER_ID_REQUIRED') {
      return res.status(400).json({ ok:false, error:e.message });
    }
    if (e.response?.status === 404) {
      // la orden no existe en Woo
      return res.status(404).json({ ok:false, error:'woo_order_not_found' });
    }
    if (e.code === 'WOO_CFG_MISSING') {
      return res.status(412).json({ ok:false, error:e.message });
    }
    return res.status(502).json({ ok:false, error:'woo_sync_failed', detail: e.message });
  }
});

module.exports = router;
