import { useEffect, useState } from 'react';
import { api } from '../supabaseClient.js';

function fmt(n) {
  return Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 6 });
}

/** Dashboard: saldo besar + alamat + copy + QR (wallet aktif).
 *  Saldo live hanya untuk wallet utama (server). Wallet vault menampilkan
 *  status pending-cli sampai derive + sync worker selesai (TODO-CLI). */
export default function Dashboard({ wallet, goSend }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isServer = wallet?.source === 'server';

  async function load() {
    if (!isServer) return;
    try {
      setError('');
      setData(await api('/balance'));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => {
    load();
    if (!isServer) return undefined;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.id]);

  const address = wallet?.address || data?.address || '';
  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(address)}`
    : '';

  return (
    <div>
      <div className="card">
        <div className="muted">Saldo tersedia — {wallet?.label}</div>
        {isServer ? (
          <>
            <div className="balance-big">{data ? fmt(data.balance) : '—'} <small>OPCA</small></div>
            <p className="muted">
              Terkunci: {data ? fmt(data.locked) : '—'} OPCA ·
              Total: {data ? fmt(data.total) : '—'} OPCA ·
              Tinggi blok: {data?.height ?? '—'}
            </p>
            <p>
              <span className={`badge ${data?.synced ? 'ok' : 'offline'}`}>
                {data?.synced ? 'Tersinkron' : 'Belum sync / offline'}
              </span>{' '}
              <span className="muted">Update terakhir: {data?.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : '—'}</span>
            </p>
          </>
        ) : (
          <p className="muted">
            Wallet vault ini belum menampilkan saldo — alamat masih menunggu
            verifikasi derive via opacra-wallet-cli (TODO-CLI). Seed sudah
            tersimpan terenkripsi, tapi saldo &amp; kirim belum aktif.
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={goSend}>Kirim</button>
          <button className="btn secondary" style={{ flex: 1 }} onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Alamat terima</h3>
        <p className="mono">{address || '— (belum ada alamat)'}</p>
        {address && (
          <>
            <button className="btn secondary" style={{ width: 'auto', marginTop: 0 }}
              onClick={async () => { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? 'Disalin ✓' : 'Salin alamat'}
            </button>
            <div style={{ marginTop: 14 }}>
              <div className="qrbox"><img src={qrUrl} alt="QR alamat Opacra" /></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
