import { useEffect, useState } from 'react';
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

const PAGES = [
  { id: 'dashboard', label: 'Beranda' },
  { id: 'send', label: 'Kirim' },
  { id: 'receive', label: 'Terima' },
  { id: 'history', label: 'Riwayat' },
  { id: 'mining', label: 'Mining' },
  { id: 'settings', label: 'Pengaturan' },
];

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

  if (loading) return <div className="app"><p className="muted">Memuat…</p></div>;
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
    <div className="app">
      <header className="topbar">
        <div className="logo">Opacra <span>Wallet</span></div>
        <button className="btn secondary" style={{ width: 'auto', marginTop: 0 }} onClick={logout}>
          Keluar
        </button>
      </header>
      <p className="muted" style={{ margin: '0 4px 4px' }}>
        Dompet aktif: <strong>{wallet.label}</strong>
        {wallet.derivation_status === 'pending-cli' && ' — alamat belum diverifikasi (TODO-CLI)'}
      </p>
      <nav className="nav">
        {PAGES.map((p) => (
          <button key={p.id} className={page === p.id ? 'active' : ''}
            onClick={() => setPage(p.id)}>{p.label}</button>
        ))}
      </nav>
      {page === 'dashboard' && <Dashboard wallet={wallet} goSend={() => setPage('send')} />}
      {page === 'send' && <Send wallet={wallet} />}
      {page === 'receive' && <Receive wallet={wallet} />}
      {page === 'history' && <History wallet={wallet} />}
      {page === 'mining' && <Mining />}
      {page === 'settings' && <Settings wallet={wallet} onPickWallet={pickWallet}
        onCreate={() => setFlow('create')} onImport={() => setFlow('import')} session={session} />}
      <footer className="footer">
        Opacra (OPCA) — login Google lapis pertama, kirim tetap butuh PIN 6 digit.
        Seed wallet utama tidak pernah keluar dari ai-server; wallet vault tersimpan
        terenkripsi (AES-GCM) dan hanya bisa dibuka dengan password enkripsi kamu.
      </footer>
    </div>
  );
}
