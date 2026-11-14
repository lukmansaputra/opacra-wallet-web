import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { Alert, Badge, Button, Card, IconCheck, IconCopy, MoneyCard, Skeleton } from '../components/ui/index.js';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {isServer ? (
        loading && !data ? (
          <div className="px-1 pt-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-11 w-56" />
            <div className="mt-6 flex justify-center gap-6">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-10 w-full" />
          </div>
        ) : (
          <MoneyCard
            user={{ name: wallet?.label || 'Wallet Utama' }}
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
        <Card>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Saldo — {wallet?.label}</h3>
            <Badge tone="warning" dot>
              pending-cli
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Wallet vault ini belum menampilkan saldo — alamat masih menunggu
            verifikasi derive via opacra-wallet-cli (TODO-CLI). Seed sudah
            tersimpan terenkripsi, tapi saldo &amp; kirim belum aktif.
          </p>
        </Card>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <section>
        <h3 className="px-1 text-sm font-semibold text-white">Alamat terima</h3>
        {address ? (
          <div className="mt-3 flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-2.5">
              <img src={qrUrl} alt="QR alamat Opacra" className="block h-[180px] w-[180px]" />
            </div>
            <p className="break-all px-2 text-center font-mono text-xs leading-relaxed text-muted">
              {address}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-auto px-4"
            >
              {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              {copied ? 'Disalin' : 'Salin alamat'}
            </Button>
          </div>
        ) : (
          <p className="mt-2 px-1 text-sm text-muted">— (belum ada alamat)</p>
        )}
      </section>
    </motion.div>
  );
}
