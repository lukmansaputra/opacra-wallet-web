import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, IconCheck, IconChevronLeft, IconCopy } from '../components/ui/index.js';

/** Halaman Terima: alamat + QR + salin (untuk wallet aktif). */
export default function Receive({ wallet, onBack }) {
  const [copied, setCopied] = useState(false);
  const address = wallet?.address || '';
  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`
    : '';

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
    >
      <IconChevronLeft size={16} />
      Beranda
    </button>
  ) : null;

  if (!address) {
    return (
      <Card>
        {backButton}
        <h2 className="text-xl font-semibold">Terima OPCA</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Alamat wallet ini belum tersedia — derive alamat masih menunggu
          verifikasi worker via opacra-wallet-cli (TODO-CLI).
          Jangan terima dana ke wallet ini sampai alamatnya muncul.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {backButton}
      <h2 className="text-xl font-semibold">Terima OPCA</h2>
      <p className="mt-1 text-sm text-muted">
        Wallet: <strong className="text-white">{wallet.label}</strong>
      </p>
      <div className="mt-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="rounded-xl bg-white p-3"
        >
          <img src={qrUrl} alt="QR alamat Opacra" className="block h-[200px] w-[200px]" />
        </motion.div>
        <p className="mt-5 break-all px-2 text-center font-mono text-[13px] leading-relaxed text-muted">
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
          className="mt-4 w-auto px-4"
        >
          {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
          {copied ? 'Disalin' : 'Salin alamat'}
        </Button>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Kirim OPCA hanya ke alamat di atas. Pastikan jaringan Opacra.
        </p>
      </div>
    </Card>
  );
}
