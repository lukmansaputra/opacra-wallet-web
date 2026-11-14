import { useState } from 'react';
import { motion } from 'framer-motion';
import { MAIN_WALLET, setActiveWallet } from '../walletStore.js';
import { Button, Card, IconImport, IconPlus, IconServer } from '../components/ui/index.js';

/** Onboarding setelah login Google: pilih wallet utama atau buat/import baru. */
export default function Onboarding({ goCreate, goImport, onDone }) {
  const [busy, setBusy] = useState(false);

  function useMain() {
    setBusy(true);
    setActiveWallet(MAIN_WALLET);
    onDone(MAIN_WALLET);
  }

  const options = [
    {
      key: 'main',
      icon: IconServer,
      title: 'Wallet Utama (ai-server)',
      desc: 'Dompet Lukmana yang sudah ada di ai-server. Seed-nya tidak pernah keluar dari server — web ini hanya menampilkan saldo & alamatnya.',
      extra: <p className="mt-2 break-all font-mono text-xs text-muted">{MAIN_WALLET.address}</p>,
      cta: 'Pakai Wallet Utama',
      variant: 'primary',
      onClick: useMain,
      disabled: busy,
    },
    {
      key: 'create',
      icon: IconPlus,
      title: 'Buat Wallet Baru',
      desc: 'Buat dompet Opacra baru (seed phrase 25 kata). Seed dibuat di browser kamu, dienkripsi dengan password enkripsi sebelum disimpan — server tidak pernah melihat seed plaintext.',
      cta: 'Buat Wallet Baru',
      variant: 'secondary',
      onClick: goCreate,
    },
    {
      key: 'import',
      icon: IconImport,
      title: 'Import Wallet',
      desc: 'Sudah punya dompet Opacra? Import lewat seed phrase 25 kata atau private key (spend key). Kunci dienkripsi di browser sebelum disimpan.',
      cta: 'Import Wallet',
      variant: 'secondary',
      onClick: goImport,
    },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          Selamat datang di Opacra Wallet
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Pilih dompet yang mau dipakai. Kamu bisa tambah / ganti dompet nanti di Pengaturan.
        </p>

        <div className="mt-6 space-y-3">
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <motion.div
                key={o.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.25 }}
              >
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold">{o.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{o.desc}</p>
                      {o.extra}
                      <Button
                        variant={o.variant}
                        onClick={o.onClick}
                        disabled={o.disabled}
                        className="mt-4"
                      >
                        {o.cta}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
