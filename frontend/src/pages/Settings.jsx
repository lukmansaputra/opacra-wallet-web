import { useEffect, useState } from 'react';
import { api } from '../supabaseClient.js';
import { MAIN_WALLET, getActiveWallet } from '../walletStore.js';
import { clearSessionPassword } from '../crypto/vault.js';

/** Pengaturan: ganti wallet, akun Google, PIN, password enkripsi vault. */
export default function Settings({ wallet, onPickWallet, onCreate, onImport, session }) {
  const [wallets, setWallets] = useState([MAIN_WALLET]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/wallets').then((d) => {
      const vaults = (d.wallets || []).map((w) => ({
        id: w.id, label: w.label, source: 'vault',
        address: w.address, derivation_status: w.derivation_status,
      }));
      setWallets([MAIN_WALLET, ...vaults]);
    }).catch((e) => setError(e.message));
  }, []);

  const active = getActiveWallet();

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pengaturan</h2>
        <p className="muted">Login sebagai: <strong>{session?.user?.email}</strong> (Google)</p>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Dompet saya</h3>
        {wallets.map((w) => (
          <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <strong>{w.label}</strong>{' '}
              <span className="muted">({w.source === 'server' ? 'ai-server' : 'vault terenkripsi'})</span>
              <div className="mono">{w.address || 'alamat belum diverifikasi (TODO-CLI)'}</div>
            </div>
            <button className="btn secondary" style={{ width: 'auto', marginTop: 0 }}
              disabled={active.id === w.id}
              onClick={() => onPickWallet(w)}>
              {active.id === w.id ? 'Aktif ✓' : 'Pakai'}
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn secondary" style={{ flex: 1 }} onClick={onCreate}>+ Buat wallet</button>
          <button className="btn secondary" style={{ flex: 1 }} onClick={onImport}>+ Import wallet</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>PIN kirim (wajib)</h3>
        <p>
          PIN 6 digit <strong>wajib untuk setiap kirim OPCA</strong>, tanpa pengecualian.
          3x PIN salah → kirim dikunci 15 menit.
        </p>
        <p>
          PIN <strong>tidak bisa dibuat atau diganti lewat web ini</strong> — hanya via
          ai-server: <code>node scripts/set-pin.js</code> di <code>worker/</code>,
          lalu restart worker.
        </p>
        <h3>Password enkripsi vault</h3>
        <p className="muted">
          Password ini mengenkripsi seed wallet vault di browser (AES-GCM).
          Ganti password berarti re-enkripsi vault — fitur ini TODO
          (saat ini: buat wallet baru bila password hilang; vault lama tidak bisa dibuka).
        </p>
        <button className="btn secondary" onClick={() => clearSessionPassword()}>
          Lupakan password enkripsi sesi ini
        </button>
        <p className="muted">Dipakai saat ini: {wallet?.label} ({wallet?.source})</p>
      </div>
    </div>
  );
}
