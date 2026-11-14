// Vault terenkripsi client-side (WebCrypto).
//
// Desain: seed / private key TIDAK PERNAH disimpan plaintext di Supabase,
// Vercel, GitHub, atau log. Sebelum disimpan, kunci dienkripsi DI BROWSER
// dengan password enkripsi user (bukan PIN kirim — ini password terpisah
// yang hanya user yang tahu):
//   PBKDF2(password, salt acak 16B, 600.000 iterasi, SHA-256)
//     -> kunci AES-GCM 256-bit
//     -> enkripsi JSON { mnemonic?, spendKey?, viewKey? } (AES-GCM, IV acak 12B)
// Yang disimpan di Supabase (tabel wallets.encrypted_vault) hanya:
//   { salt, iv, ct } — semuanya base64, tidak ada plaintext.
// Server tidak pernah melihat password enkripsi maupun isi vault.
// Password enkripsi dipegang di memori saja selama sesi (module variable),
// TIDAK PERNAH di localStorage / sessionStorage / cookie.
//
// JUJUR: enkripsi ini melindungi isi vault saat disimpan, TAPI:
//  - kalau password enkripsi lemah / sama dengan PIN, vault bisa di-brute-force.
//  - kalau browser / perangkat ter-compromise, kunci di memori bisa dicuri.
//  - alamat hasil derive dari mnemonic/spend key di web masih TODO-CLI
//    (lihat mnemonic.js) — sampai terverifikasi, wallet vault berstatus
//    "belum terverifikasi CLI" dan kirim dari wallet vault BELUM aktif.

const ITERATIONS = 600000;

function b64encode(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function deriveKey(password, saltBytes) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

/** @returns {Promise<{salt:string, iv:string, ct:string}>} */
export async function encryptVault(password, secretObj) {
  if (!password || password.length < 8) {
    throw new Error('Password enkripsi minimal 8 karakter');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = new TextEncoder().encode(JSON.stringify(secretObj));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { salt: b64encode(salt), iv: b64encode(iv), ct: b64encode(new Uint8Array(ct)) };
}

/** @returns {Promise<object>} isi vault yang sudah didekripsi. */
export async function decryptVault(password, vault) {
  const key = await deriveKey(password, b64decode(vault.salt));
  let plain;
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64decode(vault.iv) },
      key, b64decode(vault.ct),
    );
  } catch (_) {
    throw new Error('Password enkripsi salah — vault tidak bisa dibuka');
  }
  return JSON.parse(new TextDecoder().decode(plain));
}

// Password enkripsi sesi — memori saja, tidak pernah dipersist.
let sessionPassword = null;
export function setSessionPassword(pw) { sessionPassword = pw; }
export function getSessionPassword() { return sessionPassword; }
export function clearSessionPassword() { sessionPassword = null; }
