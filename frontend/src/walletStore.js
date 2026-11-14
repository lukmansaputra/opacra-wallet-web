// Penyimpanan wallet aktif — localStorage hanya untuk METADATA (id, label,
// alamat). TIDAK PERNAH menyimpan seed / private key / password enkripsi.
// Vault terenkripsi disimpan di Supabase (ciphertext saja), password enkripsi
// dipegang di memori (vault.js) selama sesi.

const KEY = 'opacra_active_wallet';
const ONBOARDED_KEY = 'opacra_onboarded';

// Alamat publik wallet utama Lukmana (alamat terima — bukan rahasia).
export const MAIN_WALLET_ADDRESS =
  'Pa2TXGib2PHQ41hywkqEV385oaakBEgbU9KNFZf6Zfsc5V3D5qPJK18QnFMJEyZZ7mgv5JwZ543HW6jKMKwjvVFR88G8U3C8v2';

export const MAIN_WALLET = {
  id: 'main',
  label: 'Utama (ai-server)',
  source: 'server',
  address: MAIN_WALLET_ADDRESS,
  derivation_status: 'verified',
};

export function getActiveWallet() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return MAIN_WALLET;
    return JSON.parse(raw);
  } catch (_) {
    return MAIN_WALLET;
  }
}

export function setActiveWallet(wallet) {
  localStorage.setItem(KEY, JSON.stringify(wallet));
  localStorage.setItem(ONBOARDED_KEY, '1');
}

export function isOnboarded() {
  return localStorage.getItem(ONBOARDED_KEY) === '1';
}

export function markOnboarded() {
  localStorage.setItem(ONBOARDED_KEY, '1');
}

export function resetOnboarding() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(ONBOARDED_KEY);
}
