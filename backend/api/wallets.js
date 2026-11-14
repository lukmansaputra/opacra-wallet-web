'use strict';
// /api/wallets — daftar wallet vault (metadata saja, TANPA ciphertext vault)
// dan registrasi wallet vault baru (ciphertext terenkripsi client-side).
// Server TIDAK PERNAH menerima / menyimpan seed plaintext.
const { requireUser } = require('../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../lib/supabase');

module.exports = async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const sb = supabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('wallets').select('id,label,address,derivation_status,source,created_at')
        .eq('owner_id', user.id).order('created_at', { ascending: true });
      if (error) return json(res, 502, { error: `Gagal baca wallet: ${error.message}` });
      return json(res, 200, { wallets: data || [] });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const v = body.encrypted_vault;
      if (!v || typeof v !== 'object' || !v.salt || !v.iv || !v.ct) {
        return json(res, 400, { error: 'encrypted_vault (salt/iv/ct) wajib — vault harus dienkripsi client-side dulu' });
      }
      // Tolak kalau ada yang mencoba mengirim secret plaintext lewat field ini.
      if (body.mnemonic || body.spendKey || body.seed || body.privateKey) {
        return json(res, 400, { error: 'Secret plaintext tidak boleh dikirim ke server' });
      }
      if (body.address && !/^Pa[1-9A-HJ-NP-Za-km-z]{93}$/.test(body.address)) {
        return json(res, 400, { error: 'Alamat tidak valid' });
      }
      const { data, error } = await sb.from('wallets').insert({
        owner_id: user.id,
        label: String(body.label || 'Wallet').slice(0, 80),
        address: body.address || null,
        source: 'vault',
        encrypted_vault: v,
        derivation_status: body.derivation_status === 'verified' ? 'verified' : 'pending-cli',
      }).select('id,label,address,derivation_status,source,created_at').single();
      if (error) return json(res, 502, { error: `Gagal simpan wallet: ${error.message}` });
      return json(res, 201, data);
    }

    return methodGuard(req, res, ['GET', 'POST']);
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
