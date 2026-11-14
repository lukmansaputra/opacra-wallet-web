'use strict';
// GET /api/transactions?limit=50 — riwayat dari cache Supabase.
const { requireUser } = require('../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!methodGuard(req, res, ['GET'])) return;
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10) || 50, 1), 100);
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('wallet_transactions')
      .select('*').eq('owner_id', user.id)
      .order('created_at', { ascending: false }).limit(limit);
    if (error) return json(res, 502, { error: `Gagal baca riwayat: ${error.message}` });
    return json(res, 200, { transactions: data || [] });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
