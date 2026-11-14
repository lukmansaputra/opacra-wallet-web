'use strict';
// GET /api/mining — status mining dari cache Supabase (mining_stats, id=1).
const { requireUser } = require('../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!methodGuard(req, res, ['GET'])) return;
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('mining_stats').select('*').eq('id', 1).single();
    if (error) return json(res, 502, { error: `Gagal baca mining: ${error.message}` });
    if (!data) return json(res, 200, { status: 'offline', pool: null, hashrate: null, blocks_found: 0, uptime: null, updated_at: null });
    return json(res, 200, {
      status: data.status, pool: data.pool, hashrate: data.hashrate,
      blocks_found: data.blocks_found, uptime: data.uptime, updated_at: data.updated_at,
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
