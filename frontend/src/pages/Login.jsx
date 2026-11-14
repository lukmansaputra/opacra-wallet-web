import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, signInWithGoogle } from '../supabaseClient.js';
import { Alert, Button, Card, IconWallet, Input } from '../components/ui/index.js';

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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-[#06130A]">
            <IconWallet size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Opacra Wallet
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Dompet Opacra (OPCA) — saldo, kirim, terima, riwayat, mining.
          </p>
        </div>

        <Card>
          <button
            type="button"
            onClick={google}
            disabled={googleBusy}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-3 text-[15px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4] ring-1 ring-zinc-200">
              G
            </span>
            {googleBusy ? 'Mengalihkan ke Google…' : 'Masuk dengan Google'}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted">
            <span className="h-px flex-1 bg-white/10" />
            atau
            <span className="h-px flex-1 bg-white/10" />
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
            <Button type="submit" variant="secondary" disabled={busy} className="mt-5">
              {busy ? 'Memeriksa…' : 'Masuk dengan email'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            Login Google adalah lapis pertama. Kirim OPCA tetap butuh PIN 6 digit.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
