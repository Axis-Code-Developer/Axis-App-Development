// src/services/db.js
const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return admin;
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FB_PROJECT_ID || 'axis-app-eda62',
  });
  return admin;
}

const app = initAdmin();
const db = admin.firestore();

module.exports = { admin, db };
