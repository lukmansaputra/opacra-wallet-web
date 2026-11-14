'use strict';
// POST /api/send — buat permintaan kirim (status pending).
// PIN WAJIB (6 digit). Tanpa PIN -> 400. PIN salah format -> 400.
// Backend TIDAK memverifikasi PIN (tidak punya hash-nya) dan TIDAK me-log PIN.
// PIN hanya diteruskan sebagai field sementara `pin_transient` di
// wallet_send_requests; worker ai-server yang memverifikasi hash-nya lalu
// MENGHAPUS field itu (update jadi NULL) dalam hitungan detik.
// Jadi PIN plaintext hanya hidup sebentar di Supabase (RLS owner-only,
// terenkripsi at-rest), tidak pernah di Vercel, GitHub, atau log.
const { requireUser } = require('../lib/auth');
const { supabaseAdmin, json, methodGuard } = require('../lib/supabase');
const { validateSend } = require('../lib/validate');
const { rateLimit, sendRateLimitKey } = require('../lib/ratelimit');

module.exports = async (req, res) => {
  if (!methodGuard(req, res, ['POST'])) return;
  try {
    const user = await requireUser(req);
    if (!user) return json(res, 401, { error: 'Login dulu (token tidak valid)' });

    const limit = Number(process.env.SEND_RATE_LIMIT_PER_MINUTE || 5);
    const rl = rateLimit(sendRateLimitKey(req, user.id), limit);
    if (!rl.allowed) return json(res, 429, { error: 'Terlalu banyak permintaan kirim, coba lagi sebentar lagi' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    // Defense in depth #1: tolak tanpa PIN sebelum apa pun.
    const err = validateSend(body);
    if (err) return json(res, 400, { error: err });

    const sb = supabaseAdmin();

    // Cek lockout PIN (ditetapkan worker setelah 3x salah).
    const { data: state } = await sb.from('wallet_state').select('send_locked_until,balance').eq('id', 1).single();
    if (state && state.send_locked_until && new Date(state.send_locked_until) > new Date()) {
      return json(res, 423, {
        error: `Kirim dikunci sampai ${new Date(state.send_locked_until).toLocaleString('id-ID')} karena 3x PIN salah. Tunggu sampai kunci dibuka.`,
        locked_until: state.send_locked_until,
      });
    }
    if (state && Number(body.amount) > Number(state.balance || 0)) {
      return json(res, 400, { error: 'Saldo tidak cukup' });
    }

    const { data, error } = await sb.from('wallet_send_requests').insert({
      owner_id: user.id,
      to_address: String(body.to).trim(),
      amount: Number(body.amount),
      // Field sementara — worker HARUS menull-kan ini setelah verifikasi PIN.
      pin_transient: String(body.pin),
      status: 'pending',
    }).select('id,status,created_at').single();
    if (error) return json(res, 502, { error: `Gagal membuat permintaan kirim: ${error.message}` });

    await sb.from('audit_log').insert({
      owner_id: user.id, event: 'send_requested',
      detail: { request_id: data.id, to_address: String(body.to).trim(), amount: Number(body.amount) },
    });

    // JANGAN pernah kembalikan PIN di respons.
    return json(res, 202, { id: data.id, status: data.status, created_at: data.created_at });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
