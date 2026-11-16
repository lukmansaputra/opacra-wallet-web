import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DragToConfirm,
  IconChevronLeft,
  Input,
} from '../components/ui/index.js';

const PIN_RE = /^\d{6}$/;

export default function Send({ wallet, onBack }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [reqId, setReqId] = useState(null);
  const [status, setStatus] = useState(null);
  const [lock, setLock] = useState(null);

  const isServer = wallet?.source === 'server';

  // Cek status kunci kirim (lockout PIN) dari backend.
  useEffect(() => {
    if (!isServer) return;
    api('/balance').then((b) => {
      if (b.send_locked_until && new Date(b.send_locked_until) > new Date()) {
        setLock(b.send_locked_until);
      }
    }).catch(() => {});
  }, [isServer]);

  // Poll status permintaan kirim sampai done/failed.
  useEffect(() => {
    if (!reqId) return undefined;
    const t = setInterval(async () => {
      try {
        const s = await api(`/send/${reqId}`);
        setStatus(s);
        if (s.status === 'done' || s.status === 'failed') {
          clearInterval(t);
          if (s.status === 'failed' && /PIN/i.test(s.error || '')) {
            setError(s.error);
            setInfo('');
          }
        }
      } catch (e) { setError(e.message); clearInterval(t); }
    }, 3000);
    return () => clearInterval(t);
  }, [reqId]);

  // Kirim hanya aktif untuk wallet utama (server) — worker ai-server yang
  // mengeksekusi. Wallet vault belum punya signer (TODO-CLI/SIGNER).
  if (!isServer) {
    return (
      <Card>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <IconChevronLeft size={16} />
            Beranda
          </button>
        )}
        <h2 className="text-xl font-semibold">Kirim OPCA</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Kirim dari wallet <strong className="text-white">{wallet?.label}</strong> belum
          aktif. Wallet vault ini menunggu integrasi signer worker (TODO-CLI/SIGNER):
          worker belum bisa menandatangani dari vault terenkripsi karena
          password enkripsi hanya ada di browser kamu.
          Untuk kirim, ganti dulu ke Wallet Utama di Pengaturan.
        </p>
      </Card>
    );
  }

  async function executeSend() {
    setBusy(true);
    try {
      const res = await api('/send', { method: 'POST', body: { to, amount: Number(amount), pin } });
      setReqId(res.id);
      setInfo('Permintaan terkirim. Menunggu worker ai-server memverifikasi PIN dan mengeksekusi…');
      setPin(''); // jangan simpan PIN di state lebih lama dari perlu
      setConfirm(false);
    } catch (err) {
      if (err.status === 423) {
        setLock(err.data?.locked_until || null);
        setError(err.message);
      } else {
        setError(err.message);
      }
      setConfirm(false);
    } finally { setBusy(false); }
  }

  function submit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setStatus(null);
    if (!PIN_RE.test(pin)) {
      setError('PIN wajib 6 digit angka. Kirim tidak bisa tanpa PIN.');
      return;
    }
    // Langkah 1: buka dialog konfirmasi (drag-to-confirm) — PIN + jumlah
    // sudah tervalidasi di sini; POST baru terjadi setelah drag selesai.
    if (!confirm) { setConfirm(true); return; }
    executeSend();
  }

  const locked = lock && new Date(lock) > new Date();

  return (
    <Card>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <IconChevronLeft size={16} />
          Beranda
        </button>
      )}
      <h2 className="text-xl font-semibold">Kirim OPCA</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Web ini <strong className="text-white">publik</strong>, jadi{' '}
        <strong className="text-white">PIN 6 digit WAJIB untuk setiap kirim</strong>,
        tanpa pengecualian. PIN tidak pernah disimpan di web / Supabase / Vercel —
        hanya hash-nya di file lokal ai-server, dan worker yang memverifikasinya.
      </p>
      {locked && (
        <Alert tone="error" className="mt-4">
          Kirim dikunci sampai {new Date(lock).toLocaleString('id-ID')} karena 3x PIN salah
          berturut-turut. Tunggu sampai kunci dibuka, lalu coba lagi.
        </Alert>
      )}
      <form onSubmit={submit} className="mt-2">
        <Input
          label="Alamat tujuan (Pa… / Ps…)"
          value={to}
          onChange={(e) => setTo(e.target.value.trim())}
          required
          placeholder="Pa2TXGib2PHQ41hywkqEV385oaakBEgbU9KNFZf6Zfsc5V3D5qPJK18QnFMJEyZZ7mgv5JwZ543HW6jKMKwjvVFR88G8U3C8v2"
        />
        <Input
          label="Jumlah (OPCA)"
          type="number"
          step="0.000001"
          min="0.000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="1.0"
        />
        <Input
          label="PIN 6 digit (wajib)"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          placeholder="••••••"
          hint="PIN dikirim via HTTPS, diverifikasi worker ai-server, lalu dihapus dari antrean."
        />
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        {info && (
          <Alert tone="success" className="mt-4">
            {info}
          </Alert>
        )}
        <Button type="submit" disabled={busy || locked} className="mt-5">
          {busy ? 'Mengirim…' : 'Kirim'}
        </Button>
      </form>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-xl border border-white/5 bg-white/[0.03] p-4"
        >
          <p className="text-sm">
            Status:{' '}
            <Badge
              tone={status.status === 'done' ? 'success' : status.status === 'failed' ? 'danger' : 'warning'}
              dot
              pulse={status.status === 'pending'}
            >
              {status.status}
            </Badge>
          </p>
          {status.txid && (
            <p className="mt-2 break-all font-mono text-xs text-muted">txid: {status.txid}</p>
          )}
          {status.error && (
            <Alert tone="error" className="mt-3">
              {status.error}
            </Alert>
          )}
          {status.status === 'pending' && (
            <p className="mt-2 text-sm text-muted">Worker ai-server memproses… (cek tiap 3 detik)</p>
          )}
        </motion.div>
      )}

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Konfirmasi kirim"
        footer={
          <DragToConfirm
            label="Geser untuk konfirmasi kirim"
            confirmLabel="Terkirim — memproses…"
            disabled={busy}
            onConfirm={executeSend}
          />
        }
      >
        <p className="text-sm leading-relaxed">
          Yakin kirim{' '}
          <strong className="text-accent">{amount} OPCA</strong> ke{' '}
          <span className="break-all font-mono text-xs">{to}</span>?
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Geser kenop sampai ujung untuk mengeksekusi. PIN sudah tervalidasi formatnya
          dan akan diverifikasi worker ai-server sebelum transfer dijalankan.
        </p>
      </Dialog>
    </Card>
  );
}
