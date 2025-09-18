// src/services/stores.js
const { db } = require('./db');

/**
 * Devuelve la configuración de tienda para un tenant (p.ej. 'axis').
 * Estructura esperada del doc (colección 'stores', id = tenantId):
 * { platform: 'woo', baseUrl: 'https://tu-sitio.com', ck: '...', cs: '...' }
 */
async function getStoreConfig(tenantId) {
  if (!tenantId) return null;
  const snap = await db.collection('stores').doc(tenantId).get();
  if (!snap.exists) return null;
  return snap.data();
}

module.exports = { getStoreConfig };