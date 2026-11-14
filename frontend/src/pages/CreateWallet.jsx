import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../supabaseClient.js';
import { generateMnemonic } from '../crypto/mnemonic.js';
import { encryptVault, setSessionPassword } from '../crypto/vault.js';
import { setActiveWallet } from '../walletStore.js';
import { Alert, Input, MagneticButton, SpotlightCard } from '../components/ui/index.js';

/**
 * Buat wallet baru (client-side):
 *  1. Set password enkripsi vault (min 8 karakter, BUKAN PIN kirim).
 *  2. Generate seed phrase 25 kata di browser -> tampilkan SEKALI SAJA
 *     dengan peringatan backup -> konfirmasi 3 kata acak.
 *  3. Enkripsi vault (AES-GCM) -> simpan ciphertext ke Supabase via backend.
 *     Seed plaintext TIDAK PERNAH dikirim ke backend / Supabase.
 *  4. Alamat hasil derive: TODO-CLI — derive alamat dari mnemonic butuh
 *     opacra-wallet-cli di worker (lihat README). Sampai itu selesai,
 *     wallet berstatus derivation_status='pending-cli' dan kirim dari
 *     wallet ini BELUM aktif.
 */
const STEPS = ['Password', 'Seed phrase', 'Konfirmasi'];

export default function CreateWallet({ onDone, onBack }) {
  const [step, setStep] = useState(1);
  const [label, setLabel] = useState('');
  const [encPw, setEncPw] = useState('');
  const [encPw2, setEncPw2] = useState('');
  const [words, setWords] = useState([]);
  const [checked, setChecked] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function startGenerate(e) {
    e.preventDefault();
    setError('');
    if (encPw.length < 8) return setError('Password enkripsi minimal 8 karakter');
    if (encPw !== encPw2) return setError('Password enkripsi tidak sama');
    const w = generateMnemonic();
    setWords(w);
    // 3 posisi acak untuk konfirmasi (1-based untuk user).
    const pos = [...new Set([1, 2, 3].map(() => 1 + Math.floor(Math.random() * 25)))];
    while (pos.length < 3) pos.push(1 + Math.floor(Math.random() * 25));
    setQuiz(pos.slice(0, 3));
    setAnswers({});
    setStep(2);
  }

  function goQuiz() {
    if (!checked) return setError('Centang dulu bahwa kamu sudah mencatat seed phrase di tempat aman');
    setError('');
    setStep(3);
  }

  async function finish() {
    setError('');
    for (const p of quiz) {
      if ((answers[p] || '').trim().toLowerCase() !== words[p - 1]) {
        return setError(`Kata ke-${p} salah — cek lagi catatanmu`);
      }
    }
    setBusy(true);
    try {
      const vault = await encryptVault(encPw, { mnemonic: words.join(' ') });
      setSessionPassword(encPw);
      const res = await api('/wallets', {
        method: 'POST',
        body: {
          label: label || 'Wallet Baru',
          address: null,
          encrypted_vault: vault,
          derivation_status: 'pending-cli',
        },
      });
      const wallet = { id: res.id, label: res.label, source: 'vault', address: null, derivation_status: 'pending-cli' };
      setActiveWallet(wallet);
      onDone(wallet);
    } catch (e) {
      setError(e.message);
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
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Buat Wallet Baru</h2>

        {/* Indikator langkah */}
        <div className="mt-5">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    step > i + 1 || step === i + 1 ? 'bg-accent' : 'bg-white/10'
                  }`}
                />
                <span
                  className={`text-center text-[11px] font-semibold ${
                    step === i + 1 ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {i + 1}. {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            {step === 1 && (
              <form onSubmit={startGenerate}>
                <p className="text-sm leading-relaxed text-muted">
                  Seed phrase dibuat di browser kamu dan dienkripsi dengan password ini
                  sebelum disimpan. Password ini hanya kamu yang tahu — kalau hilang,
                  vault tidak bisa dibuka lagi.
                </p>
                <Input
                  label="Nama wallet"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Wallet Baru"
                />
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
                <MagneticButton type="submit" className="mt-5">
                  Buat seed phrase →
                </MagneticButton>
              </form>
            )}

            {step === 2 && (
              <div>
                <Alert tone="warning">
                  <strong>CATAT SEED PHRASE INI SEKARANG.</strong> Seed ini hanya
                  ditampilkan sekali. Siapa pun yang punya 25 kata ini bisa mengambil
                  alih wallet-mu. Jangan screenshot ke cloud, jangan kirim lewat chat.
                </Alert>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {words.map((w, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="rounded-xl border border-line bg-card2 px-3 py-2"
                    >
                      <span className="text-xs text-muted">{i + 1}.</span>{' '}
                      <strong className="text-sm">{w}</strong>
                    </motion.div>
                  ))}
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  Saya sudah mencatat 25 kata ini di tempat aman (kertas / offline)
                </label>
                {error && (
                  <Alert tone="error" className="mt-4">
                    {error}
                  </Alert>
                )}
                <MagneticButton onClick={goQuiz} className="mt-5">
                  Lanjut ke konfirmasi →
                </MagneticButton>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-sm text-muted">
                  Buktikan kamu mencatatnya — isi kata berikut dari seed phrase-mu:
                </p>
                {quiz.map((p) => (
                  <Input
                    key={p}
                    label={`Kata ke-${p}`}
                    value={answers[p] || ''}
                    onChange={(e) => setAnswers({ ...answers, [p]: e.target.value })}
                    autoComplete="off"
                    placeholder={`kata ke-${p}`}
                  />
                ))}
                {error && (
                  <Alert tone="error" className="mt-4">
                    {error}
                  </Alert>
                )}
                <MagneticButton onClick={finish} disabled={busy} className="mt-5">
                  {busy ? 'Menyimpan vault terenkripsi…' : 'Selesai — simpan wallet'}
                </MagneticButton>
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Alamat wallet akan muncul setelah worker ai-server memverifikasi derive
                  via opacra-wallet-cli (TODO-CLI). Sampai saat itu wallet berstatus
                  “alamat belum diverifikasi” dan kirim dari wallet ini belum aktif.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </SpotlightCard>
    </div>
  );
}
