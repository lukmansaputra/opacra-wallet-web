import { useState } from 'react';
import { MAIN_WALLET, setActiveWallet } from '../walletStore.js';

/** Onboarding setelah login Google: pilih wallet utama atau buat/import baru. */
export default function Onboarding({ goCreate, goImport, onDone }) {
  const [busy, setBusy] = useState(false);

  function useMain() {
    setBusy(true);
    setActiveWallet(MAIN_WALLET);
    onDone(MAIN_WALLET);
  }

  return (
    <div className="app" style={{ maxWidth: 560 }}>
      <div className="card" style={{ marginTop: 40 }}>
        <h1 style={{ marginTop: 0 }}>Selamat datang di Opacra Wallet</h1>
        <p className="muted">Pilih dompet yang mau dipakai. Kamu bisa tambah / ganti dompet nanti di Pengaturan.</p>

        <div className="card" style={{ background: 'var(--card2)' }}>
          <h3 style={{ marginTop: 0 }}>Wallet Utama (ai-server)</h3>
          <p className="muted">
            Dompet Lukmana yang sudah ada di ai-server. Seed-nya tidak pernah keluar
            dari server — web ini hanya menampilkan saldo &amp; alamatnya.
          </p>
          <p className="mono">{MAIN_WALLET.address}</p>
          <button className="btn" onClick={useMain} disabled={busy}>Pakai Wallet Utama</button>
        </div>

        <div className="card" style={{ background: 'var(--card2)' }}>
          <h3 style={{ marginTop: 0 }}>Buat Wallet Baru</h3>
          <p className="muted">
            Buat dompet Opacra baru (seed phrase 25 kata). Seed dibuat di browser kamu,
            dienkripsi dengan password enkripsi sebelum disimpan — server tidak pernah
            melihat seed plaintext.
          </p>
          <button className="btn secondary" onClick={goCreate}>Buat Wallet Baru</button>
        </div>

        <div className="card" style={{ background: 'var(--card2)' }}>
          <h3 style={{ marginTop: 0 }}>Import Wallet</h3>
          <p className="muted">
            Sudah punya dompet Opacra? Import lewat seed phrase 25 kata atau private
            key (spend key). Kunci dienkripsi di browser sebelum disimpan.
          </p>
          <button className="btn secondary" onClick={goImport}>Import Wallet</button>
        </div>
      </div>
    </div>
  );
}
