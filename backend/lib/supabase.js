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

// CORS: frontend (opacra-wallet-web.vercel.app) memanggil backend ini
// cross-origin + header Authorization, jadi browser mengirim preflight
// OPTIONS dulu. Tanpa header di bawah ini + jawaban OPTIONS, browser
// memblokir semua panggilan api() dengan "Failed to fetch".
// Daftar origin boleh ditambah via env FRONTEND_URL (pisah koma).
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'https://opacra-wallet-web.vercel.app')
  .split(',').map((s) => s.trim()).filter(Boolean);

function corsHeaders(req, res) {
  const origin = req && req.headers && req.headers.origin;
  const allow = (origin && ALLOWED_ORIGINS.includes(origin)) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function json(res, status, body) {
  // Semua handler lewat methodGuard (sudah set header CORS), tapi pastikan
  // header tetap ada bila json() dipanggil langsung.
  if (!res.getHeader('Access-Control-Allow-Origin')) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
    res.setHeader('Vary', 'Origin');
  }
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function methodGuard(req, res, allowed) {
  corsHeaders(req, res);
  // Jawab preflight browser tanpa masuk ke logika handler.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (!allowed.includes(req.method)) {
    json(res, 405, { error: `Method ${req.method} tidak diizinkan` });
    return false;
  }
  return true;
}

module.exports = { supabaseAdmin, json, methodGuard };
