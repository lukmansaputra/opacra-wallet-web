'use strict';
// POST /api/wallets/derive — antrekan derive alamat untuk wallet vault.
// TODO-CLI: derive alamat dari mnemonic/spend key butuh opacra-wallet-cli di
// worker ai-server. Endpoint ini HANYA mengantrekan permintaan (tanpa secret
// apa pun — mnemonic TIDAK BOLEH dikirim ke sini). Worker memproses antrean
// dan mengisi wallets.address + derivation_status, atau gagal dengan pesan
// TODO-CLI yang jelas bila integrasi CLI belum selesai.
const { requireUser } = require('../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!methodGuard(req, res, ['POST'])) return;
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body.mnemonic || body.spendKey || body.seed || body.privateKey) {
      return json(res, 400, { error: 'Secret plaintext tidak boleh dikirim ke server' });
    }
    if (!body.wallet_id) return json(res, 400, { error: 'wallet_id wajib' });
    if (!['create', 'import'].includes(body.kind)) {
      return json(res, 400, { error: "kind harus 'create' atau 'import'" });
    }
    const sb = supabaseAdmin();
    const { data: wallet, error: werr } = await sb
      .from('wallets').select('id').eq('id', body.wallet_id).eq('owner_id', user.id).single();
    if (werr || !wallet) return json(res, 404, { error: 'Wallet tidak ditemukan' });
    const { data, error } = await sb.from('wallet_requests').insert({
      owner_id: user.id, wallet_id: body.wallet_id, kind: body.kind, status: 'pending',
    }).select('id,status,created_at').single();
    if (error) return json(res, 502, { error: `Gagal antrekan derive: ${error.message}` });
    return json(res, 202, data);
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
