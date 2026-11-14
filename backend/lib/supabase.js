'use strict';
// Client Supabase server-side. Pakai service_role HANYA di backend (Vercel env).
// Key ini me-bypass RLS, jadi jangan pernah diimpor / dikirim ke frontend.
const { createClient } = require('@supabase/supabase-js');

let client = null;

function supabaseAdmin() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum disetel');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function methodGuard(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    json(res, 405, { error: `Method ${req.method} tidak diizinkan` });
    return false;
  }
  return true;
}

module.exports = { supabaseAdmin, json, methodGuard };
