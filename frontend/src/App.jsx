import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient.js';
import { getActiveWallet, isOnboarded, setActiveWallet } from './walletStore.js';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import CreateWallet from './pages/CreateWallet.jsx';
import ImportWallet from './pages/ImportWallet.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Send from './pages/Send.jsx';
import Receive from './pages/Receive.jsx';
import History from './pages/History.jsx';
import Mining from './pages/Mining.jsx';
import Settings from './pages/Settings.jsx';
import { clearSessionPassword } from './crypto/vault.js';
import { AnimatedTabs, Badge, MagneticButton, Skeleton } from './components/ui/index.js';

const PAGES = [
  { id: 'dashboard', label: 'Beranda', icon: '◈' },
  { id: 'send', label: 'Kirim', icon: '↑' },
  { id: 'receive', label: 'Terima', icon: '↓' },
  { id: 'history', label: 'Riwayat', icon: '≡' },
  { id: 'mining', label: 'Mining', icon: '⛏' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙' },
];

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22, ease: 'easeOut' },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [flow, setFlow] = useState('main'); // main | onboarding | create | import
  const [wallet, setWallet] = useState(() => getActiveWallet());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
      if (data.session && !isOnboarded()) setFlow('onboarding');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s && !isOnboarded()) setFlow('onboarding');
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function pickWallet(w) {
    setWallet(w);
    setActiveWallet(w);
    setFlow('main');
    setPage('dashboard');
  }

  async function logout() {
    clearSessionPassword();
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
        <p className="mt-6 text-center text-sm text-muted">Memuat…</p>
      </div>
    );
  }
  if (!session) return <Login />;
  if (flow === 'onboarding') {
    return <Onboarding goCreate={() => setFlow('create')} goImport={() => setFlow('import')} onDone={pickWallet} />;
  }
  if (flow === 'create') {
    return <CreateWallet onDone={pickWallet} onBack={() => setFlow('onboarding')} />;
  }
  if (flow === 'import') {
    return <ImportWallet onDone={pickWallet} onBack={() => setFlow('onboarding')} />;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-10">
      <header className="sticky top-0 z-40 -mx-4 border-b border-line/70 bg-ink/85 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-emerald-700 text-lg font-black text-[#06130a] shadow-glow">
              ◈
            </div>
            <div className="leading-tight">
              <p className="text-[17px] font-extrabold tracking-tight">
                Opacra <span className="text-accent">Wallet</span>
              </p>
              <p className="text-[11px] font-medium text-muted">Dompet OPCA · ai-server</p>
            </div>
          </div>
          <MagneticButton
            variant="secondary"
            size="sm"
            magnetic={false}
            onClick={logout}
            className="w-auto"
          >
            Keluar
          </MagneticButton>
        </div>
      </header>

      <div className="mt-4 flex items-center justify-between gap-2 px-1">
        <p className="min-w-0 truncate text-sm text-muted">
          Dompet aktif: <strong className="text-text">{wallet.label}</strong>
        </p>
        {wallet.derivation_status === 'pending-cli' && (
          <Badge tone="warning" dot>
            alamat belum diverifikasi
          </Badge>
        )}
      </div>

      <nav className="mt-3">
        <AnimatedTabs tabs={PAGES} value={page} onChange={setPage} />
      </nav>

      <AnimatePresence mode="wait">
        <motion.main key={page} {...pageMotion} className="mt-4">
          {page === 'dashboard' && (
            <Dashboard
              wallet={wallet}
              goSend={() => setPage('send')}
              goReceive={() => setPage('receive')}
              goHistory={() => setPage('history')}
            />
          )}
          {page === 'send' && <Send wallet={wallet} />}
          {page === 'receive' && <Receive wallet={wallet} />}
          {page === 'history' && <History wallet={wallet} />}
          {page === 'mining' && <Mining />}
          {page === 'settings' && (
            <Settings
              wallet={wallet}
              onPickWallet={pickWallet}
              onCreate={() => setFlow('create')}
              onImport={() => setFlow('import')}
              session={session}
            />
          )}
        </motion.main>
      </AnimatePresence>

      <footer className="mt-8 border-t border-line/70 px-2 pt-5 text-center text-xs leading-relaxed text-muted">
        Opacra (OPCA) — login Google lapis pertama, kirim tetap butuh PIN 6 digit.
        <br />
        Seed wallet utama tidak pernah keluar dari ai-server; wallet vault tersimpan
        terenkripsi (AES-GCM) dan hanya bisa dibuka dengan password enkripsi kamu.
      </footer>
    </div>
  );
}
