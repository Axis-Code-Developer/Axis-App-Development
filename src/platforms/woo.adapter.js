const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

/**
 * Valida y normaliza la config para Woo.
 * cfg = { baseUrl, ck, cs }
 */
function normalizeCfg(cfg = {}) {
  const url = cfg.baseUrl || process.env.WOO_BASE_URL;
  const ck  = cfg.ck      || process.env.WOO_CK;
  const cs  = cfg.cs      || process.env.WOO_CS;

  if (!url || !ck || !cs) {
    const missing = [
      !url && 'baseUrl',
      !ck && 'ck',
      !cs && 'cs',
    ].filter(Boolean).join(', ');
    const hint = 'Provide tenants/{tenantId}.woo or .env (WOO_BASE_URL, WOO_CK, WOO_CS)';
    const e = new Error(`Woo config missing: ${missing}. ${hint}`);
    e.code = 'WOO_CFG_MISSING';
    throw e;
  }
  return { baseUrl: url, ck, cs };
}

/**
 * Crea el cliente Woo REST v3.
 */
function createWooClient(cfg) {
  const { baseUrl, ck, cs } = normalizeCfg(cfg);
  return new WooCommerceRestApi({
    url: baseUrl,
    consumerKey: ck,
    consumerSecret: cs,
    version: 'wc/v3',
    timeout: 15000,
  });
}

/**
 * Convierte el payload de Woo a nuestro modelo interno.
 * Mantén el shape estable para que mañana otros marketplaces usen el mismo.
 */
function normalizeOrder(raw) {
  const id = String(raw?.id ?? raw?.number ?? Date.now());
  const status = String(raw?.status || 'pending');
  const total = Number(raw?.total || raw?.total_price || 0);
  const currency = raw?.currency || 'USD';

  const customer = {
    name: [raw?.billing?.first_name, raw?.billing?.last_name].filter(Boolean).join(' ') || '',
    email: raw?.billing?.email || '',
    phone: raw?.billing?.phone || '',
  };

  const items = Array.isArray(raw?.line_items)
    ? raw.line_items.map(li => ({
        sku: li?.sku || '',
        name: li?.name || '',
        qty: Number(li?.quantity || 0),
        price: Number(li?.price || li?.subtotal || 0),
      }))
    : [];

  const storeId = raw?.store_id || 'default';
  const tenantId = 'axis';

  return {
    id,
    platform: 'woo',
    platformOrderId: id,
    storeId,
    tenantId,
    status,
    total,
    currency,
    customer,
    items,
    createdAt: Date.parse(raw?.date_created || raw?.date_created_gmt || new Date().toISOString()),
    updatedAt: Date.now(),
    source: 'webhook',
    raw, // guardamos el original para trazabilidad
  };
}

module.exports = { createWooClient, normalizeCfg, normalizeOrder };
