import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { Alert, AnimatedNumber, Badge, Skeleton } from '../components/ui/index.js';

export default function Mining() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/mining')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const mining = data?.status === 'mining';
  const hashrate = Number(data?.hashrate) || 0;
  // Bilah hashrate relatif terhadap 2 kH/s (skala visual saja).
  const barPct = Math.max(4, Math.min(100, (hashrate / 2000) * 100));

  const stats = [
    { label: 'Hashrate', value: hashrate ? `${hashrate.toLocaleString('id-ID')} H/s` : '—' },
    { label: 'Pool', value: data?.pool || '—' },
    { label: 'Blok ditemukan', value: data?.blocks_found ?? '—' },
    { label: 'Uptime worker', value: data?.uptime || '—' },
  ];

  return (
    <div className="px-1 pt-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Mining</h2>
        <Badge tone={mining ? 'success' : 'neutral'} dot pulse={mining}>
          {mining ? 'Mining' : data?.status || 'offline'}
        </Badge>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={hashrate}
                decimals={0}
                className="text-4xl font-semibold tracking-tight tabular-nums"
              />
              <span className="font-semibold text-muted">H/s</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              />
            </div>
          </div>

          <dl className="mt-6 divide-y divide-white/5 border-t border-white/5 text-sm">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 py-3">
                <dt className="text-muted">{s.label}</dt>
                <dd className="font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
      <p className="mt-4 text-xs text-muted">
        Update terakhir:{' '}
        {data?.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : '—'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Mining jalan di ai-server via XMRig (terpisah dari wallet). Kalau XMRig mati,
        status jadi offline — wallet tetap bisa dipakai.
      </p>
    </div>
  );
}
