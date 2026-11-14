'use strict';
// GET /api/send/:id — status satu permintaan kirim.
// PIN tidak pernah dikembalikan di respons ini.
const { requireUser } = require('../../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (!methodGuard(req, res, ['GET'])) return;
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const id = req.query.id;
    if (!id) return json(res, 400, { error: 'id wajib' });
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('wallet_send_requests')
      .select('id,status,txid,error,to_address,amount,created_at,processed_at')
      .eq('id', id).eq('owner_id', user.id).single();
    if (error || !data) return json(res, 404, { error: 'Permintaan kirim tidak ditemukan' });
    return json(res, 200, data);
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
