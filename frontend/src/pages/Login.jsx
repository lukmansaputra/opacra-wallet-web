import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, signInWithGoogle } from '../supabaseClient.js';
import { Alert, Input, MagneticButton, SpotlightCard } from '../components/ui/index.js';

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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-accent to-emerald-700 text-3xl font-black text-[#06130a] shadow-glow">
            ◈
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            Opacra <span className="text-accent">Wallet</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Dompet Opacra (OPCA) — saldo, kirim, terima, riwayat, mining.
          </p>
        </div>

        <SpotlightCard>
          <MagneticButton onClick={google} disabled={googleBusy} size="lg" className="mt-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-[#4285F4]">
              G
            </span>
            {googleBusy ? 'Mengalihkan ke Google…' : 'Masuk dengan Google'}
          </MagneticButton>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
            <span className="h-px flex-1 bg-line" />
            atau
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submitEmail}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="lkmsptr05@gmail.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && (
              <Alert tone="error" className="mt-4">
                {error}
              </Alert>
            )}
            <MagneticButton type="submit" variant="secondary" disabled={busy} className="mt-5">
              {busy ? 'Memeriksa…' : 'Masuk dengan email'}
            </MagneticButton>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            Login Google adalah lapis pertama. Kirim OPCA tetap butuh PIN 6 digit.
          </p>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
