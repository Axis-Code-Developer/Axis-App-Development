const { db } = require('./db');

function ordersCol() {
  return db.collection('orders');
}
function eventsCol() {
  return db.collection('events');
}

/**
 * Guarda/actualiza una orden normalizada en Firestore y registra un evento.
 * - Upsert en orders/{id}
 * - Evento append-only en events/
 */
async function saveOrder(order) {
  if (!order?.id) throw new Error('order.id required');
  const id = String(order.id);

  const payload = {
    ...order,
    updatedAt: Date.now(),
  };

  await ordersCol().doc(id).set(payload, { merge: true });
  await eventsCol().add({
    type: 'order_saved',
    orderId: id,
    platform: order.platform || 'woo',
    ts: Date.now(),
  });

  return id;
}

module.exports = { saveOrder };
