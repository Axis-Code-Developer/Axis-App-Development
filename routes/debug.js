// routes/debug.js
const express = require('express');
const admin = require('firebase-admin');
const { db } = require('../src/services/db');
const router = express.Router();

router.get('/firestore', async (_req, res) => {
  try {
    const ref = db.collection('diag').doc('ping'); // <-- antes era "__diag__"
    await ref.set({ ts: Date.now() }, { merge: true });
    const snap = await ref.get();
    res.json({ ok: true, data: snap.data() || null });
  } catch (e) {
    console.error('[debug:firestore] error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.get('/api/debug/firebase', (req, res) => {
  const app = admin.app();
  const pid = app.options.projectId || app.options.credential?.projectId || null;
  return res.json({ projectId: pid });
});

router.get('/api/debug/verify', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1] || '';
    const decoded = await admin.auth().verifyIdToken(token);
    return res.json({ ok: true, aud: decoded.aud, iss: decoded.iss, uid: decoded.user_id, email: decoded.email });
  } catch (e) {
    return res.status(401).json({ ok: false, error: e.message });
  }
});

module.exports = router;