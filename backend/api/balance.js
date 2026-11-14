'use strict';
// GET /api/balance — saldo dari cache Supabase (wallet_state, id=1).
// Termasuk send_locked_until agar frontend bisa menampilkan pesan kunci kirim.
const { requireUser } = require('../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!methodGuard(req, res, ['GET'])) return;
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('wallet_state').select('*').eq('id', 1).single();
    if (error) return json(res, 502, { error: `Gagal baca saldo: ${error.message}` });
    if (!data) return json(res, 404, { error: 'Wallet belum pernah di-sync worker' });
    if (data.owner_id && data.owner_id !== user.id) {
      return json(res, 403, { error: 'Bukan wallet kamu' });
    }
    return json(res, 200, {
      address: data.address,
      balance: Number(data.balance),
      locked: Number(data.locked),
      total: Number(data.total),
      height: data.height,
      synced: !!data.synced,
      updated_at: data.updated_at,
      send_locked_until: data.send_locked_until || null,
      failed_pin_attempts: data.failed_pin_attempts || 0,
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
