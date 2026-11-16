'use strict';
// Worker ai-server: poll antrean kirim (5 detik) + sync state (30 detik).
// JANGAN log password / seed / PIN / isi file hash. Log hanya ringkasan.
// Env bisa dari .env (via dotenv bila terpasang) atau dari systemd EnvironmentFile.
try { require('dotenv').config(); } catch (_) { /* dotenv opsional */ }

const fs = require('fs');
const { supabaseAdmin } = require('./supabase');
const { makeCli } = require('./opacra');
const { verifyPin } = require('./pin');

const ADDR_RE = /^(Pa[1-9A-HJ-NP-Za-km-z]{96}|Ps[1-9A-HJ-NP-Za-km-z]{96}|Pi[1-9A-HJ-NP-Za-km-z]{107})$/;
const POLL_MS = Number(process.env.WORKER_POLL_SECONDS || 5) * 1000;
const SYNC_MS = Number(process.env.WORKER_SYNC_SECONDS || 30) * 1000;
const PIN_MAX_ATTEMPTS = Number(process.env.PIN_MAX_ATTEMPTS || 3);
const PIN_LOCK_MINUTES = Number(process.env.PIN_LOCK_MINUTES || 15);
const MAX_SEND = Number(process.env.MAX_SEND_OPCA || 10);

const cfg = {
  walletCli: process.env.OPACRA_WALLET_CLI || '/home/user/opacra/opacra-wallet-cli',
  walletFile: process.env.OPACRA_WALLET_FILE || '',
  passwordFile: process.env.OPACRA_WALLET_PASSWORD_FILE || '',
  daemonHost: process.env.OPACRA_DAEMON_HOST || '127.0.0.1',
  daemonPort: Number(process.env.OPACRA_DAEMON_PORT || 18081),
  pinHashFile: process.env.OPACRA_SEND_PIN_HASH_FILE || '',
  xmrigLog: process.env.XMRIG_LOG_FILE || '',
  xmrigApi: process.env.XMRIG_API_URL || '',
  pool: process.env.MINING_POOL || 'NurseryPool',
};

const sb = supabaseAdmin();
const cli = makeCli(cfg);
const { processWalletRequests } = require('./walletRequests');

function log(...a) { console.log(new Date().toISOString(), '[worker]', ...a); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Hapus PIN sementara dari row — WAJIB dipanggil di semua jalur keluar proses request. */
async function clearPin(rowId) {
  await sb.from('wallet_send_requests').update({ pin_transient: null }).eq('id', rowId);
}

async function audit(ownerId, event, detail) {
  try {
    await sb.from('audit_log').insert({ owner_id: ownerId, event, detail });
  } catch (e) { log('audit gagal:', e.message); }
}

async function getState() {
  const { data } = await sb.from('wallet_state').select('*').eq('id', 1).single();
  return data || null;
}

async function setState(patch) {
  const { error } = await sb.from('wallet_state').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) log('setState gagal:', error.message);
}

async function failRequest(row, reason) {
  await sb.from('wallet_send_requests').update({
    status: 'failed', error: reason, processed_at: new Date().toISOString(), pin_transient: null,
  }).eq('id', row.id);
  await audit(row.owner_id, 'send_failed', { request_id: row.id, reason });
  log(`request ${row.id} FAILED: ${reason}`);
}

async function processPending() {
  const { data: rows, error } = await sb
    .from('wallet_send_requests').select('*')
    .eq('status', 'pending').order('created_at', { ascending: true }).limit(5);
  if (error) { log('poll gagal:', error.message); return; }
  for (const row of rows || []) {
    try {
      await processOne(row);
    } catch (e) {
      log(`request ${row.id} error:`, e.message);
      try { await failRequest(row, 'Worker error saat memproses'); } catch (_) {}
    }
  }
}

async function processOne(row) {
  // Defense in depth #1: worker menolak tanpa PIN, walau backend sudah menolak.
  // PIN diambil dari field sementara, lalu field itu DIHAPUS apa pun hasilnya.
  const pin = row.pin_transient;
  if (!pin || !/^\d{6}$/.test(pin)) {
    await failRequest(row, 'PIN wajib (6 digit). Permintaan ditolak worker.');
    return;
  }

  const state = await getState();
  // Lockout: kirim dikunci setelah 3x PIN salah.
  if (state && state.send_locked_until && new Date(state.send_locked_until) > new Date()) {
    await failRequest(row, `Kirim dikunci sampai ${new Date(state.send_locked_until).toLocaleString('id-ID')} karena 3x PIN salah.`);
    return;
  }

  // Validasi ulang (jangan percaya backend saja).
  if (!ADDR_RE.test(String(row.to_address || '').trim())) {
    await failRequest(row, 'Alamat tujuan tidak valid');
    return;
  }
  const amount = Number(row.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_SEND) {
    await failRequest(row, 'Jumlah tidak valid');
    return;
  }

  // Verifikasi PIN terhadap hash scrypt di file lokal ai-server.
  let pinOk = false;
  try {
    if (!cfg.pinHashFile || !fs.existsSync(cfg.pinHashFile)) {
      await failRequest(row, 'Hash PIN belum disetel di ai-server (jalankan scripts/set-pin.js)');
      return;
    }
    pinOk = verifyPin(pin, cfg.pinHashFile);
  } finally {
    // HAPUS PIN dari Supabase segera setelah dibaca — jangan tunggu transfer selesai.
    await clearPin(row.id);
  }

  if (!pinOk) {
    const attempts = (state?.failed_pin_attempts || 0) + 1;
    const patch = { failed_pin_attempts: attempts, last_pin_failure_at: new Date().toISOString() };
    let reason = 'PIN salah';
    if (attempts >= PIN_MAX_ATTEMPTS) {
      const until = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
      patch.send_locked_until = until.toISOString();
      patch.failed_pin_attempts = 0; // reset counter saat kunci diberlakukan
      reason = `PIN salah 3x berturut-turut. Kirim dikunci 15 menit sampai ${until.toLocaleString('id-ID')}.`;
      log(`LOCKOUT: kirim dikunci sampai ${until.toISOString()}`);
    }
    await setState(patch);
    await sb.from('wallet_send_requests').update({
      status: 'failed', error: reason, processed_at: new Date().toISOString(),
    }).eq('id', row.id);
    await audit(row.owner_id, 'pin_failed', { request_id: row.id, attempts });
    log(`request ${row.id} FAILED: ${reason}`);
    return;
  }

  // PIN benar: reset counter kegagalan.
  if ((state?.failed_pin_attempts || 0) > 0) await setState({ failed_pin_attempts: 0 });

  // Cek saldo live via wallet-cli (refresh dulu, pola terbukti ai-server).
  try { await cli.refresh(); } catch (e) { log('refresh warning:', e.message); }
  const bal = await cli.balance();
  if (amount > bal.unlocked) {
    await failRequest(row, 'Saldo tidak cukup (unlocked)');
    return;
  }

  // Eksekusi transfer. Password wallet dialirkan via file di stdin (opacra.js).
  const { txid } = await cli.transfer(String(row.to_address).trim(), amount);
  await sb.from('wallet_send_requests').update({
    status: 'done', txid: txid || null, error: null,
    processed_at: new Date().toISOString(), pin_transient: null,
  }).eq('id', row.id);
  await audit(row.owner_id, 'send_done', { request_id: row.id, to_address: row.to_address, amount, txid: txid || null });
  log(`request ${row.id} DONE txid=${txid || '(tidak ter-parse, cek log wallet)'}`);
  // Sync ulang saldo setelah kirim.
  await syncState().catch((e) => log('sync setelah kirim gagal:', e.message));
}

function parseXmrigHashrate() {
  // Fallback: baca baris "speed" terakhir di xmrig.log.
  // Format XMRig: "miner  speed 10s/60s/15m 1396.6 1292.4 1375.9 H/s max ..."
  // angka pertama setelah "10s/60s/15m" adalah hashrate 10s.
  try {
    if (!cfg.xmrigLog || !fs.existsSync(cfg.xmrigLog)) return null;
    const text = fs.readFileSync(cfg.xmrigLog, 'utf8');
    const lines = text.trim().split('\n').slice(-200);
    for (let i = lines.length - 1; i >= 0; i--) {
      const m10 = /speed\s+10s\/60s\/15m\s+([0-9.]+)/i.exec(lines[i]);
      if (m10) return Number(m10[1]);
      const m = /speed[^0-9]*([0-9.]+)\s*(kH\/s|H\/s)/i.exec(lines[i]);
      if (m) return m[2].toLowerCase().startsWith('k') ? Number(m[1]) * 1000 : Number(m[1]);
    }
  } catch (_) {}
  return null;
}

async function syncState() {
  try { await cli.refresh(); } catch (e) { log('sync refresh warning:', e.message); }
  let bal = null;
  try { bal = await cli.balance(); } catch (e) { log('sync balance gagal:', e.message); }

  const state = await getState();
  const address = state?.address || process.env.OPACRA_ADDRESS || null;
  await sb.from('wallet_state').upsert({
    id: 1,
    owner_id: state?.owner_id || null,
    address,
    balance: bal ? bal.unlocked : (state?.balance ?? 0),
    locked: bal ? Math.max(0, bal.total - bal.unlocked) : (state?.locked ?? 0),
    total: bal ? bal.total : (state?.total ?? 0),
    height: state?.height ?? null,
    synced: !!bal,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  // Mining stats: coba API XMRig, fallback log, kalau tidak ada -> offline.
  let hashrate = null;
  let status = 'offline';
  try {
    if (cfg.xmrigApi) {
      const res = await fetch(cfg.xmrigApi, { signal: AbortSignal.timeout(5000) });
      const j = await res.json();
      if (j && j.hashrate && j.hashrate.total) { hashrate = Number(j.hashrate.total[0] || 0); status = 'mining'; }
    }
  } catch (_) { /* abaikan, coba log */ }
  if (status !== 'mining') {
    const fromLog = parseXmrigHashrate();
    if (fromLog) { hashrate = fromLog; status = 'mining'; }
  }
  await sb.from('mining_stats').upsert({
    id: 1, status, pool: cfg.pool, hashrate,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  log(`sync: balance=${bal ? bal.unlocked : '?'}, mining=${status}`);
}

async function main() {
  if (!cfg.walletFile || !cfg.passwordFile) {
    log('PERINGATAN: OPACRA_WALLET_FILE / OPACRA_WALLET_PASSWORD_FILE belum disetel di .env');
  }
  if (!cfg.pinHashFile) log('PERINGATAN: OPACRA_SEND_PIN_HASH_FILE belum disetel — semua kirim akan ditolak');
  log(`worker mulai: poll ${POLL_MS / 1000}d, sync ${SYNC_MS / 1000}d, pool=${cfg.pool}`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await processPending().catch((e) => log('processPending error:', e.message));
    await processWalletRequests(cfg).catch((e) => log('walletRequests error:', e.message));
    await sleep(POLL_MS);
  }
}

// Sync loop terpisah (30 detik) — jalan paralel dengan poll loop via interval.
setInterval(() => { syncState().catch((e) => log('sync error:', e.message)); }, SYNC_MS);
syncState().catch((e) => log('sync awal gagal:', e.message));

main().catch((e) => { console.error('[worker] fatal:', e.message); process.exit(1); });
