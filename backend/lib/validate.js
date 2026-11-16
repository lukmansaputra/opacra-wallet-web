'use strict';
// Validasi input kirim. PIN WAJIB — tanpa PIN request ditolak (400).
// Aturan alamat Opacra: standar "Pa" (98 karakter), subaddress "Ps"
// (98 karakter, dipakai exchange untuk alamat deposit), integrated "Pi"
// (109 karakter). Semua base58 (tidak mengandung 0, O, I, l).
// Panjang 98 (bukan 95 seperti Monero) karena prefix Opacra 3 byte varint.
// Cek di sini ringan; worker cek ulang.

const PIN_RE = /^\d{6}$/;
const ADDR_RE = /^(Pa[1-9A-HJ-NP-Za-km-z]{96}|Ps[1-9A-HJ-NP-Za-km-z]{96}|Pi[1-9A-HJ-NP-Za-km-z]{107})$/;

function isValidAddress(addr) {
  return typeof addr === 'string' && ADDR_RE.test(addr.trim());
}

function isValidPin(pin) {
  return typeof pin === 'string' && PIN_RE.test(pin);
}

function isValidAmount(amount, maxSend) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return false;
  if (maxSend && n > Number(maxSend)) return false;
  return true;
}

/** Validasi body POST /api/send. Kembalikan string error atau null. */
function validateSend(body) {
  if (!body || typeof body !== 'object') return 'Body JSON tidak valid';
  if (!isValidAddress(body.to)) return 'Alamat tujuan tidak valid (harus alamat Opacra Pa… / Ps… / Pi…)';
  if (!isValidAmount(body.amount, process.env.MAX_SEND_OPCA || 10)) {
    return `Jumlah tidak valid (harus > 0 dan ≤ ${process.env.MAX_SEND_OPCA || 10} OPCA per kirim)`;
  }
  // PIN WAJIB — tanpa pengecualian, karena web ini publik.
  if (body.pin === undefined || body.pin === null || body.pin === '') {
    return 'PIN wajib diisi (6 digit). Kirim tanpa PIN ditolak.';
  }
  if (!isValidPin(body.pin)) return 'PIN harus 6 digit angka';
  return null;
}

module.exports = { isValidAddress, isValidPin, isValidAmount, validateSend, PIN_RE };
