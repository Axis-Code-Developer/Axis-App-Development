// scripts/admin/assignClaims.js
// Uso: node scripts/admin/assignClaims.js <uid> <role> <tenantId>
const { admin } = require('../../src/services/db');

(async () => {
  try {
    const [ , , uid, role, tenantId ] = process.argv;
    if (!uid || !role || !tenantId) {
      console.error('Uso: node scripts/admin/assignClaims.js <uid> <role> <tenantId>');
      process.exit(1);
    }
    await admin.auth().setCustomUserClaims(uid, { role, tenantId });
    // Invalida tokens antiguos para que tomen los claims en el próximo refresh
    await admin.auth().revokeRefreshTokens(uid);
    console.log(`OK: claims { role:"${role}", tenantId:"${tenantId}" } asignados a ${uid}`);
  } catch (e) {
    console.error('ERROR asignando claims:', e.message);
    process.exit(1);
  }
})();