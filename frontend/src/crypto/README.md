# Modul kripto frontend

## mnemonic.js — seed phrase 25 kata (format Monero)

Opacra turunan Monero: 24 kata = 32 byte seed, kata ke-25 = checksum
(kata ke-`(jumlah indeks 24 kata) % 24` dari 24 kata pertama).
Wordlist `english-words.json` (1626 kata) disalin dari Monero
`src/mnemonics/english.h` (lisensi BSD).

Fungsi: `generateMnemonic()`, `seedToMnemonic(seed)`,
`mnemonicToSeed(words)`, `validateMnemonic()`, `validateSpendKey()`.

**TODO-CLI-VERIFY (penting):** encode/decode diuji round-trip di repo
(`node --test` di bawah), tapi BELUM diverifikasi silang dengan
`opacra-wallet-cli`. Sebelum wallet baru dipakai untuk dana besar:
restore seed-nya di `opacra-wallet-cli` di ai-server dan pastikan alamat
yang muncul sama dengan alamat di web. Kalau berbeda, jangan pakai wallet itu.

Test round-trip (Node 20+):

```bash
node --input-type=module -e "
import { generateMnemonic, mnemonicToSeed, seedToMnemonic } from './src/crypto/mnemonic.js';
const m = generateMnemonic();
console.log(m.length, m.join(' ').slice(0, 60) + '…');
const s1 = mnemonicToSeed(m);
const m2 = seedToMnemonic(s1);
console.log('round-trip sama:', m.join(' ') === m2.join(' '));
"
```

## vault.js — enkripsi client-side (WebCrypto)

PBKDF2 (600.000 iterasi, SHA-256) -> AES-GCM 256-bit. Yang disimpan di
Supabase hanya `{ salt, iv, ct }` base64 — tidak ada plaintext.
Password enkripsi dipegang di memori saja selama sesi.
