import { useState } from 'react';

/** Halaman Terima: alamat + QR + salin (untuk wallet aktif). */
export default function Receive({ wallet }) {
  const [copied, setCopied] = useState(false);
  const address = wallet?.address || '';
  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`
    : '';

  if (!address) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Terima OPCA</h2>
        <p className="muted">
          Alamat wallet ini belum tersedia — derive alamat masih menunggu
          verifikasi worker via opacra-wallet-cli (TODO-CLI).
          Jangan terima dana ke wallet ini sampai alamatnya muncul.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Terima OPCA</h2>
      <p className="muted">Wallet: <strong>{wallet.label}</strong></p>
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div className="qrbox"><img src={qrUrl} alt="QR alamat Opacra" /></div>
      </div>
      <p className="mono" style={{ textAlign: 'center' }}>{address}</p>
      <button className="btn secondary"
        onClick={async () => { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
        {copied ? 'Disalin ✓' : 'Salin alamat'}
      </button>
      <p className="muted">Kirim OPCA hanya ke alamat di atas. Pastikan jaringan Opacra.</p>
    </div>
  );
}
