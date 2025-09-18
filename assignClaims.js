require('dotenv').config();
const { admin } = require('./src/services/db');

async function main() {
  const uid = "PrxsXZ9rrdYwzRNU6wkdeUbSoR13";

  await admin.auth().setCustomUserClaims(uid, {
    role: "admin",
    tenantId: "axis"
  });

  console.log(`✅ Claims asignados al usuario ${uid}`);
}

main().catch(err => {
  console.error("❌ Error asignando claims:", err);
  process.exit(1);
});