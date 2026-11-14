import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { MAIN_WALLET, getActiveWallet } from '../walletStore.js';
import { clearSessionPassword } from '../crypto/vault.js';
import { Alert, Badge, MagneticButton, SpotlightCard } from '../components/ui/index.js';

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
    <div className="space-y-4">
      <SpotlightCard>
        <h2 className="text-xl font-extrabold">Pengaturan</h2>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          Login sebagai: <strong className="text-text">{session?.user?.email}</strong>
          <Badge tone="success" dot>
            Google
          </Badge>
        </p>
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
      </SpotlightCard>

      <SpotlightCard>
        <h3 className="text-base font-extrabold">Dompet saya</h3>
        <ul className="mt-3 divide-y divide-line">
          {wallets.map((w, i) => (
            <motion.li
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  {w.label}
                  <Badge tone={w.source === 'server' ? 'success' : 'neutral'}>
                    {w.source === 'server' ? 'ai-server' : 'vault terenkripsi'}
                  </Badge>
                </p>
                <p className="mt-1 break-all font-mono text-xs text-muted">
                  {w.address || 'alamat belum diverifikasi (TODO-CLI)'}
                </p>
              </div>
              <MagneticButton
                variant="secondary"
                size="sm"
                magnetic={false}
                disabled={active.id === w.id}
                onClick={() => onPickWallet(w)}
                className="w-auto shrink-0"
              >
                {active.id === w.id ? 'Aktif ✓' : 'Pakai'}
              </MagneticButton>
            </motion.li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <MagneticButton variant="secondary" onClick={onCreate} className="flex-1">
            + Buat wallet
          </MagneticButton>
          <MagneticButton variant="secondary" onClick={onImport} className="flex-1">
            + Import wallet
          </MagneticButton>
        </div>
      </SpotlightCard>

      <SpotlightCard>
        <h3 className="text-base font-extrabold">PIN kirim (wajib)</h3>
        <p className="mt-2 text-sm leading-relaxed">
          PIN 6 digit <strong>wajib untuk setiap kirim OPCA</strong>, tanpa pengecualian.
          3x PIN salah → kirim dikunci 15 menit.
        </p>
        <Alert tone="warning" className="mt-3">
          PIN <strong>tidak bisa dibuat atau diganti lewat web ini</strong> — hanya via
          ai-server: <code className="font-mono text-xs">node scripts/set-pin.js</code> di{' '}
          <code className="font-mono text-xs">worker/</code>, lalu restart worker.
        </Alert>

        <h3 className="mt-6 text-base font-extrabold">Password enkripsi vault</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Password ini mengenkripsi seed wallet vault di browser (AES-GCM).
          Ganti password berarti re-enkripsi vault — fitur ini TODO
          (saat ini: buat wallet baru bila password hilang; vault lama tidak bisa dibuka).
        </p>
        <MagneticButton
          variant="secondary"
          onClick={() => {
            clearSessionPassword();
            setPwForgotten(true);
          }}
          className="mt-4"
        >
          Lupakan password enkripsi sesi ini
        </MagneticButton>
        {pwForgotten && (
          <Alert tone="success" className="mt-3">
            Password enkripsi sesi ini sudah dilupakan — kamu akan diminta lagi saat membuka vault.
          </Alert>
        )}
        <p className="mt-4 text-xs text-muted">
          Dipakai saat ini: {wallet?.label} ({wallet?.source})
        </p>
      </SpotlightCard>
    </div>
  );
}
