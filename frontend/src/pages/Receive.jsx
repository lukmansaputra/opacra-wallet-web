import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagneticButton, SpotlightCard } from '../components/ui/index.js';

/** Halaman Terima: alamat + QR + salin (untuk wallet aktif). */
export default function Receive({ wallet }) {
  const [copied, setCopied] = useState(false);
  const address = wallet?.address || '';
  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`
    : '';

  if (!address) {
    return (
      <SpotlightCard>
        <h2 className="text-xl font-extrabold">Terima OPCA</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Alamat wallet ini belum tersedia — derive alamat masih menunggu
          verifikasi worker via opacra-wallet-cli (TODO-CLI).
          Jangan terima dana ke wallet ini sampai alamatnya muncul.
        </p>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard>
      <h2 className="text-xl font-extrabold">Terima OPCA</h2>
      <p className="mt-1 text-sm text-muted">
        Wallet: <strong className="text-text">{wallet.label}</strong>
      </p>
      <div className="mt-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="rounded-3xl bg-white p-3 shadow-card"
        >
          <img src={qrUrl} alt="QR alamat Opacra" className="block h-[200px] w-[200px]" />
        </motion.div>
        <p className="mt-5 break-all px-2 text-center font-mono text-[13px] leading-relaxed text-muted">
          {address}
        </p>
        <MagneticButton
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="mt-4 max-w-xs"
        >
          {copied ? 'Disalin ✓' : 'Salin alamat'}
        </MagneticButton>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Kirim OPCA hanya ke alamat di atas. Pastikan jaringan Opacra.
        </p>
      </div>
    </SpotlightCard>
  );
}
