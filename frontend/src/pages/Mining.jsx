import { useEffect, useState } from 'react';
import { api } from '../supabaseClient.js';

export default function Mining() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/mining').then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mining</h2>
        {error && <p className="error">{error}</p>}
        <p>
          Status: <span className={`badge ${data?.status === 'mining' ? 'ok' : 'offline'}`}>
            {data?.status === 'mining' ? 'Mining' : (data?.status || 'offline')}
          </span>
        </p>
        <div className="grid2">
          <div><div className="muted">Hashrate</div><strong>{data?.hashrate ? `${data.hashrate} H/s` : '—'}</strong></div>
          <div><div className="muted">Pool</div><strong>{data?.pool || '—'}</strong></div>
          <div><div className="muted">Blok ditemukan</div><strong>{data?.blocks_found ?? '—'}</strong></div>
          <div><div className="muted">Uptime worker</div><strong>{data?.uptime || '—'}</strong></div>
        </div>
        <p className="muted">Update terakhir: {data?.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : '—'}</p>
        <p className="muted">Mining jalan di ai-server via XMRig (terpisah dari wallet). Kalau XMRig mati, status jadi offline — wallet tetap bisa dipakai.</p>
      </div>
    </div>
  );
}
