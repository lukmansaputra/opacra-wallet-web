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
import {
  Badge,
  IconClock,
  IconCpu,
  IconHome,
  IconLogout,
  IconSettings,
  IconWallet,
  Skeleton,
} from './components/ui/index.js';

/** Tab bawah ala wallet mobile: Beranda / Riwayat / Mining / Pengaturan.
 *  Kirim & Terima bukan tab — dijangkau dari aksi cepat di Beranda. */
const TABS = [
  { id: 'dashboard', label: 'Beranda', icon: IconHome },
  { id: 'history', label: 'Riwayat', icon: IconClock },
  { id: 'mining', label: 'Mining', icon: IconCpu },
  { id: 'settings', label: 'Pengaturan', icon: IconSettings },
];

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: 'easeOut' },
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
      <div className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="mt-8 h-10 w-48" />
        <Skeleton className="mt-4 h-24 w-full" />
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

  const isTabPage = TABS.some((t) => t.id === page);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-28">
      {/* Top bar minimal */}
      <header className="sticky top-0 z-40 -mx-4 border-b border-white/5 bg-ink/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#06130A]">
              <IconWallet size={18} />
            </div>
            <p className="text-[15px] font-semibold tracking-tight">Opacra Wallet</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <IconLogout size={18} />
          </button>
        </div>
      </header>

      {/* Dompet aktif */}
      <div className="mt-3 flex items-center gap-2 px-1">
        <p className="min-w-0 truncate text-xs text-muted">
          {wallet.label}
        </p>
        {wallet.derivation_status === 'pending-cli' && (
          <Badge tone="warning" dot>
            alamat belum diverifikasi
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.main key={page} {...pageMotion} className="mt-2">
          {page === 'dashboard' && (
            <Dashboard
              wallet={wallet}
              goSend={() => setPage('send')}
              goReceive={() => setPage('receive')}
              goHistory={() => setPage('history')}
            />
          )}
          {page === 'send' && <Send wallet={wallet} onBack={() => setPage('dashboard')} />}
          {page === 'receive' && <Receive wallet={wallet} onBack={() => setPage('dashboard')} />}
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

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => {
            const active = isTabPage && page === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPage(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-accent' : 'text-muted hover:text-white'
                }`}
              >
                <Icon size={21} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
