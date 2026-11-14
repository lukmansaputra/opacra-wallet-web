'use strict';
// PIN: hash scrypt (Node crypto bawaan, tanpa dependency native).
// Format file hash:  scrypt:<salt-hex>:<derived-hex>
// PIN plaintext TIDAK PERNAH disimpan. File hash permission 600 di ai-server.
const crypto = require('crypto');
const fs = require('fs');

const KEYLEN = 64;

function createPinHash(pin) {
  if (!/^\d{6}$/.test(pin)) throw new Error('PIN harus 6 digit angka');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin, salt, KEYLEN).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function loadPinHash(hashFile) {
  const raw = fs.readFileSync(hashFile, 'utf8').trim();
  const parts = raw.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    throw new Error('Format file hash PIN tidak valid (harus scrypt:salt:hash)');
  }
  return { salt: parts[1], hash: parts[2] };
}

/** Bandingkan PIN input dengan hash file. Kembalikan true/false (timing-safe). */
function verifyPin(pin, hashFile) {
  if (!/^\d{6}$/.test(pin || '')) return false;
  const { salt, hash } = loadPinHash(hashFile);
  const derived = crypto.scryptSync(pin, salt, KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

module.exports = { createPinHash, loadPinHash, verifyPin };
