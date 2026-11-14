'use strict';
// Proses antrean wallet_requests (derive alamat untuk wallet vault).
//
// TODO-CLI — BATAS IMPLEMENTASI SAAT INI (jujur, jangan dianggap selesai):
// Derive alamat dari mnemonic/spend key butuh kunci yang hanya ada di
// browser user (vault terenkripsi, password enkripsi tidak ada di server).
// Worker TIDAK BISA menderive alamat vault dari Supabase saja, karena ia
// tidak punya secret-nya — dan secret TIDAK BOLEH dikirim ke worker lewat
// Supabase plaintext.
// Yang worker BISA lakukan hari ini:
//   - Untuk wallet yang file-nya ADA di ai-server (wallet utama / wallet
//     yang dibuat via CLI di server): baca alamat via `address`.
//   - Untuk wallet vault (source='vault'): tandai request gagal dengan pesan
//     TODO-CLI yang jelas + set wallets.derivation_status='needs-cli'.
// Yang MASIH PERLU dibangun (diputuskan bareng user sebelum dipakai dana besar):
//   (a) derive client-side di browser (butuh implementasi kunci Monero:
//       keccak256 + ed25519 di JS), ATAU
//   (b) channel sekali-pakai terenkripsi untuk mengirim mnemonic ke worker
//       (mis. enkripsi dengan public key worker, lalu worker hapus setelah derive).
// Sampai salah satu selesai, wallet vault berstatus "alamat belum diverifikasi"
// dan kirim dari wallet vault BELUM aktif.
const fs = require('fs');
const { supabaseAdmin } = require('./supabase');
const { makeCli } = require('./opacra');

function log(...a) { console.log(new Date().toISOString(), '[wallet-requests]', ...a); }

async function processWalletRequests(cfg) {
  const sb = supabaseAdmin();
  const { data: rows, error } = await sb
    .from('wallet_requests').select('*')
    .eq('status', 'pending').order('created_at', { ascending: true }).limit(5);
  if (error) { log('poll gagal:', error.message); return; }
  for (const row of rows || []) {
    try {
      await processOne(sb, cfg, row);
    } catch (e) {
      log(`request ${row.id} error:`, e.message);
    }
  }
}

async function processOne(sb, cfg, row) {
  const { data: wallet } = await sb
    .from('wallets').select('*').eq('id', row.wallet_id).single();
  if (!wallet) {
    await sb.from('wallet_requests').update({
      status: 'failed',
      error: 'Wallet tidak ditemukan',
      processed_at: new Date().toISOString(),
    }).eq('id', row.id);
    return;
  }

  // Wallet server-held dengan file di ai-server: derive via CLI bisa jalan.
  const walletFile = cfg.walletFileById
    ? cfg.walletFileById(row.wallet_id)
    : null;
  if (wallet.source === 'server' && walletFile && fs.existsSync(walletFile)) {
    const cli = makeCli({ ...cfg, walletFile });
    const addr = await cli.address().catch(() => null);
    if (addr) {
      await sb.from('wallets').update({ address: addr, derivation_status: 'verified' }).eq('id', wallet.id);
      await sb.from('wallet_requests').update({ status: 'done', processed_at: new Date().toISOString() }).eq('id', row.id);
      log(`request ${row.id} DONE address=${addr.slice(0, 6)}…`);
      return;
    }
  }

  // Wallet vault: belum bisa derive (lihat header file ini).
  const reason = 'TODO-CLI: derive alamat wallet vault belum diimplementasikan — '
    + 'butuh derive client-side di browser atau channel sekali-pakai terenkripsi ke worker. '
    + 'Wallet tetap tersimpan terenkripsi; alamat belum diverifikasi.';
  await sb.from('wallets').update({ derivation_status: 'needs-cli' }).eq('id', wallet.id);
  await sb.from('wallet_requests').update({
    status: 'failed', error: reason, processed_at: new Date().toISOString(),
  }).eq('id', row.id);
  await sb.from('audit_log').insert({
    owner_id: row.owner_id, event: 'wallet_derive_todo_cli',
    detail: { request_id: row.id, wallet_id: row.wallet_id, kind: row.kind },
  });
  log(`request ${row.id} FAILED (TODO-CLI)`);
}

module.exports = { processWalletRequests };
