import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { validateMnemonic, validateSpendKey } from '../crypto/mnemonic.js';
import { encryptVault, setSessionPassword } from '../crypto/vault.js';
import { setActiveWallet } from '../walletStore.js';
import { Alert, AnimatedTabs, Input, MagneticButton, SpotlightCard } from '../components/ui/index.js';

/**
 * Import wallet: via seed phrase 25 kata ATAU spend key (64 hex).
 * Kunci divalidasi formatnya DI BROWSER, lalu dienkripsi (AES-GCM) sebelum
 * disimpan — secret plaintext TIDAK PERNAH dikirim ke backend / Supabase.
 * Alamat hasil derive: TODO-CLI (butuh opacra-wallet-cli di worker).
 * Sampai derive selesai, wallet berstatus pending-cli dan kirim belum aktif.
 */
export default function ImportWallet({ onDone, onBack }) {
  const [mode, setMode] = useState('mnemonic');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [encPw, setEncPw] = useState('');
  const [encPw2, setEncPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'mnemonic') {
      const err = validateMnemonic(secret);
      if (err) return setError(err);
    } else {
      const err = validateSpendKey(secret);
      if (err) return setError(err);
    }
    if (encPw.length < 8) return setError('Password enkripsi minimal 8 karakter');
    if (encPw !== encPw2) return setError('Password enkripsi tidak sama');
    setBusy(true);
    try {
      const secretObj = mode === 'mnemonic'
        ? { mnemonic: secret.trim().toLowerCase().split(/\s+/).join(' ') }
        : { spendKey: secret.trim().toLowerCase() };
      const vault = await encryptVault(encPw, secretObj);
      setSessionPassword(encPw);
      const res = await api('/wallets', {
        method: 'POST',
        body: {
          label: label || (mode === 'mnemonic' ? 'Wallet Import (seed)' : 'Wallet Import (key)'),
          address: null,
          encrypted_vault: vault,
          derivation_status: 'pending-cli',
        },
      });
      const wallet = { id: res.id, label: res.label, source: 'vault', address: null, derivation_status: 'pending-cli' };
      setActiveWallet(wallet);
      setSecret(''); // hapus secret dari memori form
      onDone(wallet);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <SpotlightCard>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold text-muted hover:bg-white/10 hover:text-text"
        >
          ← Kembali
        </button>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Import Wallet</h2>

        <div className="mt-5">
          <AnimatedTabs
            tabs={[
              { id: 'mnemonic', label: 'Seed Phrase (25 kata)' },
              { id: 'spendkey', label: 'Private Key (spend key)' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>

        <motion.form
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={submit}
          className="mt-2"
        >
          <Input
            label="Nama wallet"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Wallet Import"
          />
          <label className="mb-1.5 mt-4 block text-[13px] font-semibold text-muted">
            {mode === 'mnemonic'
              ? 'Seed phrase (25 kata, dipisah spasi)'
              : 'Spend key (64 karakter hex)'}
          </label>
          {mode === 'mnemonic' ? (
            <textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-line bg-card2 px-3.5 py-3 text-[15px] text-text placeholder:text-muted/60 transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="abbey abducts ability … (25 kata)"
              autoComplete="off"
            />
          ) : (
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value.trim())}
              placeholder="64 karakter hex"
              autoComplete="off"
              className="w-full rounded-2xl border border-line bg-card2 px-3.5 py-3 font-mono text-[15px] text-text placeholder:text-muted/60 transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          )}
          <Input
            label="Password enkripsi vault (min 8 karakter)"
            type="password"
            value={encPw}
            onChange={(e) => setEncPw(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label="Ulangi password enkripsi"
            type="password"
            value={encPw2}
            onChange={(e) => setEncPw2(e.target.value)}
            required
            autoComplete="new-password"
          />
          {error && (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          )}
          <MagneticButton type="submit" disabled={busy} className="mt-5">
            {busy ? 'Mengenkripsi & menyimpan…' : 'Import wallet'}
          </MagneticButton>
        </motion.form>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Alamat hasil derive akan muncul setelah worker ai-server memverifikasi
          via opacra-wallet-cli (TODO-CLI). Secret tidak pernah dikirim ke server —
          yang disimpan hanya vault terenkripsi.
        </p>
      </SpotlightCard>
    </div>
  );
}
