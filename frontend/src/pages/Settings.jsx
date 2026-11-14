import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { MAIN_WALLET, getActiveWallet } from '../walletStore.js';
import { clearSessionPassword } from '../crypto/vault.js';
import { Alert, Badge, Button } from '../components/ui/index.js';

/** Pengaturan: ganti wallet, akun Google, PIN, password enkripsi vault. */
export default function Settings({ wallet, onPickWallet, onCreate, onImport, session }) {
  const [wallets, setWallets] = useState([MAIN_WALLET]);
  const [error, setError] = useState('');
  const [pwForgotten, setPwForgotten] = useState(false);

  useEffect(() => {
    api('/wallets').then((d) => {
      const vaults = (d.wallets || []).map((w) => ({
        id: w.id, label: w.label, source: 'vault',
        address: w.address, derivation_status: w.derivation_status,
      }));
      setWallets([MAIN_WALLET, ...vaults]);
    }).catch((e) => setError(e.message));
  }, []);

  const active = getActiveWallet();

  return (
    <div className="px-1 pt-2">
      <h2 className="text-xl font-semibold">Pengaturan</h2>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
        Login sebagai: <strong className="font-medium text-white">{session?.user?.email}</strong>
        <Badge tone="success" dot>
          Google
        </Badge>
      </p>
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-white">Dompet saya</h3>
        <ul className="mt-1 divide-y divide-white/5">
          {wallets.map((w, i) => (
            <motion.li
              key={w.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {w.label}
                  <Badge tone={w.source === 'server' ? 'success' : 'neutral'}>
                    {w.source === 'server' ? 'ai-server' : 'vault terenkripsi'}
                  </Badge>
                </p>
                <p className="mt-1 break-all font-mono text-xs text-muted">
                  {w.address || 'alamat belum diverifikasi (TODO-CLI)'}
                </p>
              </div>
              {active.id === w.id ? (
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPickWallet(w)}
                  className="shrink-0 rounded-lg bg-white/5 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Pakai
                </button>
              )}
            </motion.li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCreate} className="flex-1">
            Buat wallet
          </Button>
          <Button variant="secondary" size="sm" onClick={onImport} className="flex-1">
            Import wallet
          </Button>
        </div>
      </section>

      <section className="mt-8 border-t border-white/5 pt-6">
        <h3 className="text-sm font-semibold text-white">PIN kirim (wajib)</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          PIN 6 digit <strong className="font-semibold text-white">wajib untuk setiap kirim OPCA</strong>,
          tanpa pengecualian. 3x PIN salah → kirim dikunci 15 menit.
        </p>
        <Alert tone="warning" className="mt-3">
          PIN <strong>tidak bisa dibuat atau diganti lewat web ini</strong> — hanya via
          ai-server: <code className="font-mono text-xs">node scripts/set-pin.js</code> di{' '}
          <code className="font-mono text-xs">worker/</code>, lalu restart worker.
        </Alert>

        <h3 className="mt-6 text-sm font-semibold text-white">Password enkripsi vault</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Password ini mengenkripsi seed wallet vault di browser (AES-GCM).
          Ganti password berarti re-enkripsi vault — fitur ini TODO
          (saat ini: buat wallet baru bila password hilang; vault lama tidak bisa dibuka).
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            clearSessionPassword();
            setPwForgotten(true);
          }}
          className="mt-4"
        >
          Lupakan password enkripsi sesi ini
        </Button>
        {pwForgotten && (
          <Alert tone="success" className="mt-3">
            Password enkripsi sesi ini sudah dilupakan — kamu akan diminta lagi saat membuka vault.
          </Alert>
        )}
        <p className="mt-5 text-xs text-muted">
          Dipakai saat ini: {wallet?.label} ({wallet?.source})
        </p>
      </section>
    </div>
  );
}
