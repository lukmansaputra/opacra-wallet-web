'use strict';
// Buat / ganti PIN kirim — JALANKAN HANYA DI ai-server, bukan via web.
// Script ini membaca PIN dari stdin (getpass sederhana), membuat hash scrypt,
// dan menulisnya ke file OPACRA_SEND_PIN_HASH_FILE (permission 600).
// PIN plaintext TIDAK disimpan di mana pun.
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createPinHash } = require('../src/pin');

function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Sembunyikan ketikan dengan menimpa output (trik sederhana; di terminal
    // tetap lebih aman pakai `read -s` di shell bila tersedia).
    process.stdout.write(query);
    let input = '';
    const onData = (ch) => {
      const s = ch.toString();
      if (s === '\n' || s === '\r') { process.stdin.removeListener('data', onData); rl.close(); resolve(input); }
      else if (s === '\u0003') { process.exit(1); }
      else if (s === '\u007f') { input = input.slice(0, -1); }
      else { input += s; }
    };
    process.stdin.on('data', onData);
  });
}

async function main() {
  const hashFile = process.env.OPACRA_SEND_PIN_HASH_FILE
    || '/home/user/opacra/.send-pin-hash.txt';
  const pin1 = await askHidden('PIN baru (6 digit): ');
  const pin2 = await askHidden('\nUlangi PIN: ');
  console.log('');
  if (!/^\d{6}$/.test(pin1)) { console.error('PIN harus 6 digit angka'); process.exit(1); }
  if (pin1 !== pin2) { console.error('PIN tidak sama'); process.exit(1); }
  const hash = createPinHash(pin1);
  fs.mkdirSync(path.dirname(hashFile), { recursive: true });
  fs.writeFileSync(hashFile, `${hash}\n`, { mode: 0o600 });
  console.log(`Hash PIN tersimpan di ${hashFile} (mode 600).`);
  console.log('Restart worker: sudo systemctl restart opacra-wallet-worker');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
