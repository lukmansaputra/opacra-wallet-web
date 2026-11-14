import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { Alert, Badge, MoneyCard, Skeleton, SpotlightCard } from '../components/ui/index.js';

/** Dashboard: saldo besar + alamat + copy + QR (wallet aktif).
 *  Saldo live hanya untuk wallet utama (server). Wallet vault menampilkan
 *  status pending-cli sampai derive + sync worker selesai (TODO-CLI). */
export default function Dashboard({ wallet, goSend, goReceive, goHistory }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const isServer = wallet?.source === 'server';

  async function load() {
    if (!isServer) return;
    try {
      setError('');
      setData(await api('/balance'));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
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
    <div className="space-y-4">
      {isServer ? (
        loading && !data ? (
          <div className="rounded-3xl border border-line bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-11 w-56" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
            <Skeleton className="mt-5 h-12 w-full" />
          </div>
        ) : (
          <MoneyCard
            user={{ name: wallet?.label || 'Wallet Utama', avatar: '◈' }}
            balance={data?.balance || 0}
            locked={data?.locked || 0}
            total={data?.total || 0}
            height={data?.height ?? null}
            synced={!!data?.synced}
            updatedAt={data?.updated_at || null}
            currency="OPCA"
            locale="id-ID"
            address={address}
            onSend={goSend}
            onRequest={goReceive}
            onViewAll={goHistory}
            onRefresh={load}
          />
        )
      ) : (
        <SpotlightCard>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold">Saldo — {wallet?.label}</h3>
            <Badge tone="warning" dot>
              pending-cli
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Wallet vault ini belum menampilkan saldo — alamat masih menunggu
            verifikasi derive via opacra-wallet-cli (TODO-CLI). Seed sudah
            tersimpan terenkripsi, tapi saldo &amp; kirim belum aktif.
          </p>
        </SpotlightCard>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <SpotlightCard>
        <h3 className="text-base font-extrabold">Alamat terima</h3>
        {address ? (
          <>
            <p className="mt-2 break-all font-mono text-[13px] leading-relaxed text-muted">
              {address}
            </p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="rounded-2xl bg-white p-2.5 shadow-card">
                <img src={qrUrl} alt="QR alamat Opacra" className="block h-[180px] w-[180px]" />
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  await navigator.clipboard.writeText(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-2xl border border-line2 bg-card2 px-4 py-2.5 text-sm font-bold hover:border-accent/50"
              >
                {copied ? 'Disalin ✓' : 'Salin alamat'}
              </motion.button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">— (belum ada alamat)</p>
        )}
      </SpotlightCard>
    </div>
  );
}
