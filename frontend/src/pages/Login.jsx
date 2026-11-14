import { useState } from 'react';
import { supabase, signInWithGoogle } from '../supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submitEmail(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function google() {
    setError('');
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.message);
      setGoogleBusy(false);
    }
  }

  return (
    <div className="app" style={{ maxWidth: 420 }}>
      <div className="card" style={{ marginTop: 60 }}>
        <h1 style={{ marginTop: 0 }}>Opacra <span style={{ color: 'var(--accent)' }}>Wallet</span></h1>
        <p className="muted">Dompet Opacra (OPCA) — saldo, kirim, terima, riwayat, mining.</p>
        <button className="btn" onClick={google} disabled={googleBusy}>
          {googleBusy ? 'Mengalihkan ke Google…' : 'Masuk dengan Google'}
        </button>
        <p className="muted" style={{ textAlign: 'center', margin: '14px 0 6px' }}>— atau —</p>
        <form onSubmit={submitEmail}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" placeholder="lkmsptr05@gmail.com" />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" />
          {error && <p className="error">{error}</p>}
          <button className="btn secondary" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk dengan email'}</button>
        </form>
        <p className="muted">Login Google adalah lapis pertama. Kirim OPCA tetap butuh PIN 6 digit.</p>
      </div>
    </div>
  );
}
