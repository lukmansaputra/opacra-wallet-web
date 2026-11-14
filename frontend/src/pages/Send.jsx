import { useEffect, useState } from 'react';
import { api } from '../supabaseClient.js';

const PIN_RE = /^\d{6}$/;

export default function Send({ wallet }) {
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

  // Kirim hanya aktif untuk wallet utama (server) — worker ai-server yang
  // mengeksekusi. Wallet vault belum punya signer (TODO-CLI/SIGNER).
  if (wallet?.source !== 'server') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Kirim OPCA</h2>
        <p className="muted">
          Kirim dari wallet <strong>{wallet?.label}</strong> belum aktif.
          Wallet vault ini menunggu integrasi signer worker (TODO-CLI/SIGNER):
          worker belum bisa menandatangani dari vault terenkripsi karena
          password enkripsi hanya ada di browser kamu.
          Untuk kirim, ganti dulu ke Wallet Utama di Pengaturan.
        </p>
      </div>
    );
  }

  // Cek status kunci kirim (lockout PIN) dari backend.
  useEffect(() => {
    api('/balance').then((b) => {
      if (b.send_locked_until && new Date(b.send_locked_until) > new Date()) {
        setLock(b.send_locked_until);
      }
    }).catch(() => {});
  }, []);

  // Poll status permintaan kirim sampai done/failed.
  useEffect(() => {
    if (!reqId) return;
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

  async function submit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setStatus(null);
    if (!PIN_RE.test(pin)) {
      setError('PIN wajib 6 digit angka. Kirim tidak bisa tanpa PIN.');
      return;
    }
    if (!confirm) { setConfirm(true); return; }
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
    } finally { setBusy(false); }
  }

  const locked = lock && new Date(lock) > new Date();

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Kirim OPCA</h2>
      <p className="muted">
        Web ini <strong>publik</strong>, jadi <strong>PIN 6 digit WAJIB untuk setiap kirim</strong>,
        tanpa pengecualian. PIN tidak pernah disimpan di web / Supabase / Vercel —
        hanya hash-nya di file lokal ai-server, dan worker yang memverifikasinya.
      </p>
      {locked && (
        <p className="error">
          Kirim dikunci sampai {new Date(lock).toLocaleString('id-ID')} karena 3x PIN salah
          berturut-turut. Tunggu sampai kunci dibuka, lalu coba lagi.
        </p>
      )}
      <form onSubmit={submit}>
        <label>Alamat tujuan (Pa…)</label>
        <input value={to} onChange={(e) => setTo(e.target.value.trim())} required
          placeholder="Pa2TXGib2PHQ41hywkqEV385oaakBEgbU9KNFZf6Zfsc5V3D5qPJK18QnFMJEyZZ7mgv5JwZ543HW6jKMKwjvVFR88G8U3C8v2" />
        <label>Jumlah (OPCA)</label>
        <input type="number" step="0.000001" min="0.000001" value={amount}
          onChange={(e) => setAmount(e.target.value)} required placeholder="1.0" />
        <label>PIN 6 digit (wajib)</label>
        <input type="password" inputMode="numeric" autoComplete="off" maxLength={6}
          value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required placeholder="••••••" />
        <p className="muted">PIN dikirim via HTTPS, diverifikasi worker ai-server, lalu dihapus dari antrean.</p>
        {confirm && (
          <p className="success">
            Yakin kirim {amount} OPCA ke <span className="mono">{to}</span>?
            Klik “Kirim” sekali lagi untuk konfirmasi.
          </p>
        )}
        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}
        <button className="btn" disabled={busy || locked}>
          {busy ? 'Mengirim…' : confirm ? 'Ya, kirim sekarang' : 'Kirim'}
        </button>
      </form>
      {status && (
        <div style={{ marginTop: 16 }}>
          <p>Status: <span className={`badge ${status.status === 'done' ? 'ok' : status.status === 'failed' ? 'failed' : 'pending'}`}>{status.status}</span></p>
          {status.txid && <p className="mono">txid: {status.txid}</p>}
          {status.error && <p className="error">{status.error}</p>}
          {status.status === 'pending' && <p className="muted">Worker ai-server memproses… (cek tiap 3 detik)</p>}
        </div>
      )}
    </div>
  );
}
