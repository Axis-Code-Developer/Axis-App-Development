// routes/webhooks/woo.js
const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// GET ping
router.get('/', (_req, res) => {
  res.type('text/plain').send('ok');
});

// POST firmado
router.post('/', async (req, res) => {
  try {
    const secret = process.env.WC_WEBHOOK_SECRET || '';
    const signature = req.headers['x-wc-webhook-signature'];

    // req.body ES un Buffer gracias a express.raw() en server.js
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

    // logs temporales para ver que entró
    console.log('[woo] raw len:', raw.length);
    console.log('[woo] sig hdr:', signature);

    const calc = crypto.createHmac('sha256', secret).update(raw).digest('base64');

    // OJO: timingSafeEqual lanza si las longitudes difieren; por eso checamos primero
    if (!signature || Buffer.byteLength(signature) !== Buffer.byteLength(calc)) {
      return res.status(401).type('text/plain').send('bad signature');
    }
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calc))) {
      return res.status(401).type('text/plain').send('bad signature');
    }

    const payload = JSON.parse(raw.toString('utf8'));

    // --- NUEVO BLOQUE: normalizar y guardar ---
    const { normalizeOrder } = require('../../src/platforms/woo.adapter');
    const { saveOrder } = require('../../src/services/ingest');

    const order = normalizeOrder(payload);
    await saveOrder(order);

    return res.status(200).json({ ok: true, id: order.id });
  } catch (e) {
    console.error('[webhook:woo] error', e);
    return res.status(400).type('text/plain').send('invalid json');
  }
});

module.exports = router;
