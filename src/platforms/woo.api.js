// src/platforms/woo.api.js
const fetch = require('node-fetch');
const { createWooClient } = require('./woo.adapter');

/**
 * Devuelve un objeto de config válido a partir de:
 *  1) cfg explícito { baseUrl, ck, cs }  (recomendado, multi-tenant)
 *  2) variables de entorno (fallback local): WOO_BASE_URL, WOO_CK, WOO_CS
 */
function resolveCfg(cfg) {
  const baseUrl = (cfg && cfg.baseUrl) || process.env.WOO_BASE_URL;
  const ck = (cfg && cfg.ck) || process.env.WOO_CK;
  const cs = (cfg && cfg.cs) || process.env.WOO_CS;

  if (!baseUrl || !ck || !cs) {
    throw new Error('Woo config incompleta (falta baseUrl/ck/cs)');
  }
  return { baseUrl, ck, cs };
}

/**
 * Mapea y valida estados permitidos para Woo.
 * Ajusta según tus flujos reales.
 */
const ALLOWED_STATUSES = new Set([
  'pending', 'processing', 'on-hold', 'completed',
  'cancelled', 'refunded', 'failed', 'trash',
]);

function assertStatus(status) {
  if (!status || typeof status !== 'string') {
    const e = new Error('status_required');
    e.code = 'STATUS_REQUIRED';
    throw e;
  }
  if (!ALLOWED_STATUSES.has(status)) {
    const e = new Error(`invalid_status: ${status}`);
    e.code = 'INVALID_STATUS';
    throw e;
  }
}

/**
 * Actualiza el estado de una orden en WooCommerce.
 * @param {Object} cfg  { baseUrl, ck, cs } o usa .env como fallback
 * @param {string|number} orderId
 * @param {string} status
 * @returns {Promise<{ok:boolean, data:any}>}
 */
async function updateWooOrderStatus(cfg, orderId, status) {
  assertStatus(status);
  if (!orderId) {
    const e = new Error('order_id_required');
    e.code = 'ORDER_ID_REQUIRED';
    throw e;
  }

  const woo = createWooClient(cfg);
  const res = await woo.put(`orders/${orderId}`, { status });
  return { ok: true, data: res.data };
}

/**
 * (Opcional) Obtener una orden desde Woo.
 */
async function getWooOrder(cfg, orderId) {
  if (!orderId) {
    const e = new Error('order_id_required');
    e.code = 'ORDER_ID_REQUIRED';
    throw e;
  }
  const woo = createWooClient(cfg);
  const res = await woo.get(`orders/${orderId}`);
  return { ok: true, data: res.data };
}

module.exports = {
  updateWooOrderStatus,
  getWooOrder,
};

