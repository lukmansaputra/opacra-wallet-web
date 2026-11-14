import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { Alert, IconReceive, IconSend, IconWallet, Skeleton } from '../components/ui/index.js';

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
      <div className="px-1 pt-2">
        <h2 className="text-xl font-semibold">Riwayat transaksi</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Riwayat untuk wallet vault belum tersedia — menunggu derive + sync worker (TODO-CLI).
        </p>
      </div>
    );
  }

  return (
    <div className="px-1 pt-2">
      <h2 className="text-xl font-semibold">Riwayat transaksi</h2>
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="mt-4 divide-y divide-white/5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
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
        <div className="mt-10 flex flex-col items-center px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-muted">
            <IconWallet size={22} />
          </div>
          <p className="mt-3 text-sm font-semibold">Belum ada transaksi tercatat.</p>
          <p className="mt-1 text-xs text-muted">Transaksi kirim / terima akan muncul di sini.</p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-white/5">
          {rows.map((r, i) => {
            const masuk = r.direction === 'in';
            const Icon = masuk ? IconReceive : IconSend;
            return (
              <motion.li
                key={r.id || r.txid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 py-3"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    masuk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{masuk ? 'Masuk' : 'Keluar'}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '—'}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    {r.txid || r.note || '—'}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-semibold tabular-nums ${masuk ? 'text-emerald-400' : 'text-red-400'}`}>
                  {masuk ? '+' : '−'}
                  {Number(r.amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 6 })}
                  <span className="ml-1 text-[11px] font-medium text-muted">OPCA</span>
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Data dari cache Supabase, di-sync worker tiap 30 detik.</p>
    </div>
  );
}
