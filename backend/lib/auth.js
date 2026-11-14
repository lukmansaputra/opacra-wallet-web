'use strict';
// Verifikasi JWT Supabase Auth dari header Authorization: Bearer <token>.
// Token diverifikasi lewat Supabase Auth API (bukan decode lokal tanpa cek).
const { createClient } = require('@supabase/supabase-js');

function authClient() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY belum disetel');
  return createClient(url, anon, { auth: { persistSession: false } });
}

/** @returns {Promise<{id:string,email?:string}|null>} user atau null kalau token tidak valid. */
async function requireUser(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (!m) return null;
  const { data, error } = await authClient().auth.getUser(m[1]);
  if (error || !data || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

module.exports = { requireUser };
