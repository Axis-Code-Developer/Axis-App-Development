// scripts/admin/ensureAdmin.js
// Uso:
//   node scripts/admin/ensureAdmin.js <email> <password> <tenantId>
// Ejemplo:
//   node scripts/admin/ensureAdmin.js admin@axis.com 123456789 axis

require('dotenv').config();
const { admin } = require('../../src/services/db');

async function ensureAdmin(email, password, tenantId) {
  if (!email || !password || !tenantId) {
    console.error('Uso: node scripts/admin/ensureAdmin.js <email> <password> <tenantId>');
    process.exit(1);
  }

  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️ Usuario ya existe: ${user.uid}`);
      // (opcional) actualiza password si quieres forzarlo
      await admin.auth().updateUser(user.uid, { password });
    } catch {
      user = await admin.auth().createUser({ email, password, emailVerified: true, disabled: false });
      console.log(`✅ Usuario creado: ${user.uid}`);
    }

    // Asigna claims
    const claims = { role: 'admin', tenantId };
    await admin.auth().setCustomUserClaims(user.uid, claims);
    // Revoca tokens para que el próximo login traiga los claims
    await admin.auth().revokeRefreshTokens(user.uid);

    console.log(`✅ Claims asignados a ${user.uid}:`, claims);
    console.log('👉 UID:', user.uid);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

const [ , , email, password, tenantId ] = process.argv;
ensureAdmin(email, password, tenantId);
