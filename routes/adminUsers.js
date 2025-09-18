// routes/adminUsers.js
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const auth = admin.auth();

// POST /api/admin/users  { email, password, role, tenantId, stores:[] }
router.post('/users', async (req, res) => {
  const { email, password, role='manager', tenantId='axis', stores=[] } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' });

  const user = await auth.createUser({ email, password, emailVerified: false, disabled: false });
  await auth.setCustomUserClaims(user.uid, { role, tenantId, stores });

  res.json({ ok: true, uid: user.uid, email, role, tenantId, stores });
});

// PATCH /api/admin/users/:uid/claims  { role?, tenantId?, stores? }
router.patch('/users/:uid/claims', async (req, res) => {
  const { role, tenantId, stores } = req.body || {};
  await auth.setCustomUserClaims(req.params.uid, { role, tenantId, stores });
  res.json({ ok: true, uid: req.params.uid, role, tenantId, stores });
});

module.exports = router;