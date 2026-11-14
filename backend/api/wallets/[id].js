'use strict';
// /api/wallets/:id — GET ciphertext vault (hanya pemilik, untuk didekripsi
// client-side) dan DELETE wallet. Ciphertext aman dikembalikan ke pemilik
// karena isinya terenkripsi AES-GCM; password enkripsi tidak ada di server.
const { requireUser } = require('../../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../../lib/supabase');

module.exports = async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const id = req.query.id;
    if (!id) return json(res, 400, { error: 'id wajib' });
    const sb = supabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('wallets').select('id,label,address,derivation_status,source,encrypted_vault,created_at')
        .eq('id', id).eq('owner_id', user.id).single();
      if (error || !data) return json(res, 404, { error: 'Wallet tidak ditemukan' });
      return json(res, 200, data);
    }

    if (req.method === 'DELETE') {
      const { error } = await sb.from('wallets').delete().eq('id', id).eq('owner_id', user.id);
      if (error) return json(res, 502, { error: `Gagal hapus wallet: ${error.message}` });
      return json(res, 200, { deleted: true });
    }

    return methodGuard(req, res, ['GET', 'DELETE']);
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
