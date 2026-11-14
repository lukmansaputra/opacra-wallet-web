import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { Alert, AnimatedNumber, Badge, Skeleton, SpotlightCard } from '../components/ui/index.js';

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
    <div className="space-y-4">
      <SpotlightCard>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">Mining</h2>
          <Badge tone={mining ? 'success' : 'neutral'} dot pulse={mining}>
            {mining ? 'Mining' : data?.status || 'offline'}
          </Badge>
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <div className="flex items-baseline gap-2">
                <AnimatedNumber
                  value={hashrate}
                  decimals={0}
                  className="text-4xl font-extrabold tracking-tight"
                />
                <span className="font-bold text-accent">H/s</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-line bg-black/20 px-3 py-3">
                  <p className="text-[11px] font-semibold text-muted">{s.label}</p>
                  <p className="mt-0.5 truncate text-sm font-bold">{s.value}</p>
                </div>
              ))}
            </div>
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
      </SpotlightCard>
    </div>
  );
}
