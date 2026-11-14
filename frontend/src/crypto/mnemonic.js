// Mnemonic Opacra — format Monero (electrum-style), 25 kata.
//
// Opacra adalah turunan Monero, jadi seed phrase-nya memakai format yang sama:
// 24 kata mengkode 32 byte seed (8 grup x 3 kata), kata ke-25 adalah checksum.
// Wordlist: english-words.json (1626 kata, disalin dari Monero
// src/mnemonics/english.h, lisensi BSD — lihat header file aslinya).
//
// Algoritma encode/decode mengikuti spesifikasi Monero electrum-words:
//   tiap 4 byte (uint32 little-endian) -> 3 kata:
//     w1 = n % 1626
//     w2 = (floor(n/1626) + w1) % 1626
//     w3 = (floor(n/1626^2) + w2) % 1626
//   checksum: kata ke-25 = kata ke-(jumlah indeks 24 kata pertama % 24)
//   dari 24 kata pertama.
//
// TODO-CLI-VERIFY: algoritma ini diuji round-trip di repo (encode->decode
// kembali ke byte yang sama), TAPI belum diverifikasi silang terhadap
// opacra-wallet-cli. SEBELUM memakai wallet baru untuk dana besar, wajib:
//   1. Buat wallet di web, catat seed-nya.
//   2. Restore seed itu di opacra-wallet-cli di ai-server dan pastikan
//      alamat yang muncul SAMA dengan alamat di web.
//   Kalau berbeda, JANGAN pakai wallet itu — laporkan sebagai bug.
// Sampai verifikasi itu selesai, wallet baru berstatus "belum terverifikasi CLI".

import WORDS from './english-words.json' with { type: 'json' };

const NWORDS = 1626;

export function wordIndex(word) {
  return WORDS.indexOf(word);
}

export function isValidWord(word) {
  return WORDS.includes(word);
}

/** 32 byte acak (WebCrypto) -> 25 kata mnemonic. */
export function generateMnemonic() {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  return seedToMnemonic(seed);
}

/** 32 byte -> 25 kata (encode murni, tanpa checksum acak). */
export function seedToMnemonic(seed) {
  if (seed.length !== 32) throw new Error('Seed harus 32 byte');
  const out = [];
  for (let i = 0; i < 8; i++) {
    const n = seed[i * 4]
      | (seed[i * 4 + 1] << 8)
      | (seed[i * 4 + 2] << 16)
      | (seed[i * 4 + 3] << 24);
    const u = n >>> 0; // perlakukan sebagai uint32 unsigned
    const w1 = u % NWORDS;
    const w2 = (Math.floor(u / NWORDS) + w1) % NWORDS;
    const w3 = (Math.floor(u / (NWORDS * NWORDS)) + w2) % NWORDS;
    out.push(WORDS[w1], WORDS[w2], WORDS[w3]);
  }
  // Checksum: jumlah indeks 24 kata pertama, mod 24.
  let sum = 0;
  for (const w of out) sum += wordIndex(w);
  out.push(out[sum % 24]);
  return out;
}

/** 25 kata -> 32 byte. Throw kalau format / checksum salah. */
export function mnemonicToSeed(words) {
  const list = Array.isArray(words) ? words : String(words || '').trim().split(/\s+/);
  if (list.length !== 25) throw new Error(`Seed phrase harus 25 kata (dapat ${list.length})`);
  for (const w of list) {
    if (!isValidWord(w)) throw new Error(`Kata tidak dikenal di wordlist: "${w}"`);
  }
  const first24 = list.slice(0, 24);
  let sum = 0;
  for (const w of first24) sum += wordIndex(w);
  if (list[24] !== first24[sum % 24]) {
    throw new Error('Checksum kata ke-25 tidak cocok — seed phrase salah / ada kata tertukar');
  }
  const seed = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    const w1 = wordIndex(first24[i * 3]);
    const w2 = wordIndex(first24[i * 3 + 1]);
    const w3 = wordIndex(first24[i * 3 + 2]);
    const a = w1;
    const b = (((w2 - w1) % NWORDS) + NWORDS) % NWORDS;
    const c = (((w3 - w2) % NWORDS) + NWORDS) % NWORDS;
    const n = (a + NWORDS * b + NWORDS * NWORDS * c) >>> 0;
    seed[i * 4] = n & 0xff;
    seed[i * 4 + 1] = (n >>> 8) & 0xff;
    seed[i * 4 + 2] = (n >>> 16) & 0xff;
    seed[i * 4 + 3] = (n >>> 24) & 0xff;
  }
  return seed;
}

/** Validasi ringan untuk form import: kembalikan string error atau null. */
export function validateMnemonic(input) {
  const list = String(input || '').trim().split(/\s+/).filter(Boolean);
  if (list.length === 0) return 'Seed phrase wajib diisi';
  if (list.length !== 25) return `Seed phrase harus 25 kata (baru ${list.length} kata)`;
  for (const w of list) {
    if (!isValidWord(w)) return `Kata tidak dikenal: "${w}" — cek ejaan (huruf kecil semua)`;
  }
  try {
    mnemonicToSeed(list);
  } catch (e) {
    return e.message;
  }
  return null;
}

/** Validasi spend key: 64 karakter hex. */
export function validateSpendKey(input) {
  const s = String(input || '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(s)) {
    return 'Private key (spend key) harus 64 karakter hex (0-9, a-f)';
  }
  return null;
}

export const WORD_COUNT = 25;
