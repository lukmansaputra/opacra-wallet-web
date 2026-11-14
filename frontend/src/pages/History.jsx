import { useEffect, useState } from 'react';
import { api } from '../supabaseClient.js';

export default function History({ wallet }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (wallet?.source !== 'server') return;
    api('/transactions?limit=50').then((d) => setRows(d.transactions || [])).catch((e) => setError(e.message));
  }, [wallet?.id, wallet?.source]);

  if (wallet?.source !== 'server') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Riwayat transaksi</h2>
        <p className="muted">Riwayat untuk wallet vault belum tersedia — menunggu derive + sync worker (TODO-CLI).</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Riwayat transaksi</h2>
      {error && <p className="error">{error}</p>}
      {rows.length === 0 && !error && <p className="muted">Belum ada transaksi tercatat.</p>}
      {rows.length > 0 && (
        <table>
          <thead><tr><th>Waktu</th><th>Arah</th><th>Jumlah</th><th>Txid / Keterangan</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || r.txid}>
                <td>{r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '—'}</td>
                <td>{r.direction === 'in' ? 'Masuk ↓' : 'Keluar ↑'}</td>
                <td>{Number(r.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 6 })} OPCA</td>
                <td className="mono">{r.txid || r.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted">Data dari cache Supabase, di-sync worker tiap 30 detik.</p>
    </div>
  );
}
