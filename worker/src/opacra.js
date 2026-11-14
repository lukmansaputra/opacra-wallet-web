'use strict';
// Pembungkus opacra-wallet-cli. JANGAN pernah log password / seed / PIN.
// Password wallet dialirkan via file di stdin (pola refresh yang terbukti):
//   opacra-wallet-cli --command refresh < /path/password.txt
// Bukan via argumen CLI (bisa terlihat di `ps`) dan bukan via cat.
const { spawn } = require('child_process');
const fs = require('fs');

function runCli(cli, args, { stdinFile, timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cli, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('wallet-cli timeout')); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, out, err });
    });
    if (stdinFile) {
      // Alirkan ISI file password sebagai stdin, tanpa pernah mencetaknya.
      const stream = fs.createReadStream(stdinFile);
      stream.on('error', (e) => { child.kill('SIGKILL'); clearTimeout(timer); reject(e); });
      stream.pipe(child.stdin);
    } else {
      child.stdin.end();
    }
  });
}

function parseBalance(out) {
  // Contoh output wallet-cli: "Balance: 9.037368130646, unlocked balance: 9.037368130646"
  const m = /Balance:\s*([0-9.]+).*unlocked balance:\s*([0-9.]+)/is.exec(out);
  if (!m) return null;
  return { total: Number(m[1]), unlocked: Number(m[2]) };
}

function makeCli(cfg) {
  const cli = cfg.walletCli;
  const walletArgs = ['--wallet-file', cfg.walletFile, '--daemon-host', cfg.daemonHost, '--daemon-port', String(cfg.daemonPort), '--log-level', '0'];

  async function refresh() {
    // Pola yang terbukti di ai-server (lihat AGENTS.md OPACRA WALLET REFRESH TRAP):
    // refresh butuh password di stdin tepat di prompt key-image pertama.
    return runCli(cli, [...walletArgs, '--command', 'refresh'], { stdinFile: cfg.passwordFile });
  }

  async function balance() {
    const r = await runCli(cli, [...walletArgs, '--command', 'balance'], { stdinFile: cfg.passwordFile });
    const parsed = parseBalance(r.out + '\n' + r.err);
    if (!parsed) throw new Error('Gagal parse output balance wallet-cli');
    return parsed;
  }

  async function transfer(toAddress, amount) {
    // transfer <address> <amount> — tanpa payment-id; amount dalam OPCA desimal.
    const r = await runCli(
      cli,
      [...walletArgs, '--command', `transfer ${toAddress} ${amount}`],
      { stdinFile: cfg.passwordFile, timeoutMs: 300000 },
    );
    const text = r.out + '\n' + r.err;
    // Jangan log text mentah ke log publik bila mengandung data sensitif;
    // panggil ini hanya mencatat txid / error ringkas (lihat worker.js).
    const txid = /Transaction ID:\s*([0-9a-f]{64})/i.exec(text);
    const hash = /txid[:\s]*([0-9a-f]{64})/i.exec(text);
    if (r.code !== 0 && !txid && !hash) {
      throw new Error(`transfer gagal (exit ${r.code}): ${text.slice(-500)}`);
    }
    return { txid: (txid && txid[1]) || (hash && hash[1]) || null, rawTail: text.slice(-300) };
  }

  async function transfers() {
    const r = await runCli(cli, [...walletArgs, '--command', 'show_transfers'], { stdinFile: cfg.passwordFile });
    return r.out + '\n' + r.err;
  }

  // TODO-CLI-VERIFY: perintah `address` mengikuti Monero wallet-cli.
  // Verifikasi di ai-server bahwa opacra-wallet-cli menerima perintah ini
  // dan format outputnya mengandung alamat Pa... . Bila berbeda, sesuaikan
  // regex di bawah dan catat di README worker.
  async function address() {
    const r = await runCli(cli, [...walletArgs, '--command', 'address'], { stdinFile: cfg.passwordFile });
    const text = r.out + '\n' + r.err;
    const m = /\b(Pa[1-9A-HJ-NP-Za-km-z]{93})\b/.exec(text);
    return m ? m[1] : null;
  }

  return { refresh, balance, transfer, transfers, address };
}

module.exports = { makeCli, parseBalance };
