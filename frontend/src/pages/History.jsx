import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { Alert, Skeleton, SpotlightCard } from '../components/ui/index.js';

export default function History({ wallet }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wallet?.source !== 'server') {
      setLoading(false);
      return;
    }
    api('/transactions?limit=50')
      .then((d) => setRows(d.transactions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [wallet?.id, wallet?.source]);

  if (wallet?.source !== 'server') {
    return (
      <SpotlightCard>
        <h2 className="text-xl font-extrabold">Riwayat transaksi</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Riwayat untuk wallet vault belum tersedia — menunggu derive + sync worker (TODO-CLI).
        </p>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard>
      <h2 className="text-xl font-extrabold">Riwayat transaksi</h2>
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-black/20 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 && !error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line2 px-4 py-10 text-center">
          <p className="text-3xl">◈</p>
          <p className="mt-2 text-sm font-semibold">Belum ada transaksi tercatat.</p>
          <p className="mt-1 text-xs text-muted">Transaksi kirim / terima akan muncul di sini.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r, i) => {
            const masuk = r.direction === 'in';
            return (
              <motion.li
                key={r.id || r.txid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 rounded-2xl border border-line bg-black/20 p-3"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${
                    masuk ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                  }`}
                >
                  {masuk ? '↓' : '↑'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{masuk ? 'Masuk' : 'Keluar'}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '—'}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    {r.txid || r.note || '—'}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-extrabold ${masuk ? 'text-emerald-300' : 'text-red-300'}`}>
                  {masuk ? '+' : '−'}
                  {Number(r.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 6 })}
                  <span className="ml-1 text-[11px] font-semibold text-muted">OPCA</span>
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Data dari cache Supabase, di-sync worker tiap 30 detik.</p>
    </SpotlightCard>
  );
}
