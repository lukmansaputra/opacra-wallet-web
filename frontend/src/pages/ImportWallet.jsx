import { useState } from 'react';
import { api } from '../supabaseClient.js';
import { validateMnemonic, validateSpendKey } from '../crypto/mnemonic.js';
import { encryptVault, setSessionPassword } from '../crypto/vault.js';
import { setActiveWallet } from '../walletStore.js';

/**
 * Import wallet: via seed phrase 25 kata ATAU spend key (64 hex).
 * Kunci divalidasi formatnya DI BROWSER, lalu dienkripsi (AES-GCM) sebelum
 * disimpan — secret plaintext TIDAK PERNAH dikirim ke backend / Supabase.
 * Alamat hasil derive: TODO-CLI (butuh opacra-wallet-cli di worker).
 * Sampai derive selesai, wallet berstatus pending-cli dan kirim belum aktif.
 */
export default function ImportWallet({ onDone, onBack }) {
  const [mode, setMode] = useState('mnemonic');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [encPw, setEncPw] = useState('');
  const [encPw2, setEncPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'mnemonic') {
      const err = validateMnemonic(secret);
      if (err) return setError(err);
    } else {
      const err = validateSpendKey(secret);
      if (err) return setError(err);
    }
    if (encPw.length < 8) return setError('Password enkripsi minimal 8 karakter');
    if (encPw !== encPw2) return setError('Password enkripsi tidak sama');
    setBusy(true);
    try {
      const secretObj = mode === 'mnemonic'
        ? { mnemonic: secret.trim().toLowerCase().split(/\s+/).join(' ') }
        : { spendKey: secret.trim().toLowerCase() };
      const vault = await encryptVault(encPw, secretObj);
      setSessionPassword(encPw);
      const res = await api('/wallets', {
        method: 'POST',
        body: {
          label: label || (mode === 'mnemonic' ? 'Wallet Import (seed)' : 'Wallet Import (key)'),
          address: null,
          encrypted_vault: vault,
          derivation_status: 'pending-cli',
        },
      });
      const wallet = { id: res.id, label: res.label, source: 'vault', address: null, derivation_status: 'pending-cli' };
      setActiveWallet(wallet);
      setSecret(''); // hapus secret dari memori form
      onDone(wallet);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="app" style={{ maxWidth: 560 }}>
      <div className="card" style={{ marginTop: 40 }}>
        <button className="btn secondary" style={{ width: 'auto', marginTop: 0 }} onClick={onBack}>← Kembali</button>
        <h2>Import Wallet</h2>
        <div className="nav">
          <button className={mode === 'mnemonic' ? 'active' : ''} onClick={() => setMode('mnemonic')}>Seed Phrase (25 kata)</button>
          <button className={mode === 'spendkey' ? 'active' : ''} onClick={() => setMode('spendkey')}>Private Key (spend key)</button>
        </div>
        <form onSubmit={submit}>
          <label>Nama wallet</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Wallet Import" />
          <label>{mode === 'mnemonic' ? 'Seed phrase (25 kata, dipisah spasi)' : 'Spend key (64 karakter hex)'}</label>
          {mode === 'mnemonic' ? (
            <textarea value={secret} onChange={(e) => setSecret(e.target.value)} rows={4}
              style={{ width: '100%', background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}
              placeholder="abbey abducts ability … (25 kata)" autoComplete="off" />
          ) : (
            <input value={secret} onChange={(e) => setSecret(e.target.value.trim())}
              placeholder="64 karakter hex" autoComplete="off" />
          )}
          <label>Password enkripsi vault (min 8 karakter)</label>
          <input type="password" value={encPw} onChange={(e) => setEncPw(e.target.value)} required autoComplete="new-password" />
          <label>Ulangi password enkripsi</label>
          <input type="password" value={encPw2} onChange={(e) => setEncPw2(e.target.value)} required autoComplete="new-password" />
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Mengenkripsi & menyimpan…' : 'Import wallet'}</button>
        </form>
        <p className="muted">
          Alamat hasil derive akan muncul setelah worker ai-server memverifikasi
          via opacra-wallet-cli (TODO-CLI). Secret tidak pernah dikirim ke server —
          yang disimpan hanya vault terenkripsi.
        </p>
      </div>
    </div>
  );
}
