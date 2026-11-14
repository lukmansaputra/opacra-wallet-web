import { useState } from 'react';
import { api } from '../supabaseClient.js';
import { generateMnemonic } from '../crypto/mnemonic.js';
import { encryptVault, setSessionPassword } from '../crypto/vault.js';
import { setActiveWallet } from '../walletStore.js';

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
    <div className="app" style={{ maxWidth: 560 }}>
      <div className="card" style={{ marginTop: 40 }}>
        <button className="btn secondary" style={{ width: 'auto', marginTop: 0 }} onClick={onBack}>← Kembali</button>
        <h2>Buat Wallet Baru</h2>

        {step === 1 && (
          <form onSubmit={startGenerate}>
            <p className="muted">
              Seed phrase dibuat di browser kamu dan dienkripsi dengan password ini
              sebelum disimpan. Password ini hanya kamu yang tahu — kalau hilang,
              vault tidak bisa dibuka lagi.
            </p>
            <label>Nama wallet</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Wallet Baru" />
            <label>Password enkripsi vault (min 8 karakter)</label>
            <input type="password" value={encPw} onChange={(e) => setEncPw(e.target.value)} required autoComplete="new-password" />
            <label>Ulangi password enkripsi</label>
            <input type="password" value={encPw2} onChange={(e) => setEncPw2(e.target.value)} required autoComplete="new-password" />
            {error && <p className="error">{error}</p>}
            <button className="btn">Buat seed phrase →</button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p className="error">
              ⚠️ CATAT SEED PHRASE INI SEKARANG. Seed ini hanya ditampilkan sekali.
              Siapa pun yang punya 25 kata ini bisa mengambil alih wallet-mu.
              Jangan screenshot ke cloud, jangan kirim lewat chat.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {words.map((w, i) => (
                <div key={i} style={{ background: 'var(--card2)', padding: '8px 10px', borderRadius: 8 }}>
                  <span className="muted">{i + 1}.</span> <strong>{w}</strong>
                </div>
              ))}
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={checked}
                onChange={(e) => setChecked(e.target.checked)} />
              Saya sudah mencatat 25 kata ini di tempat aman (kertas / offline)
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn" onClick={goQuiz}>Lanjut ke konfirmasi →</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="muted">Buktikan kamu mencatatnya — isi kata berikut dari seed phrase-mu:</p>
            {quiz.map((p) => (
              <div key={p}>
                <label>Kata ke-{p}</label>
                <input value={answers[p] || ''} onChange={(e) => setAnswers({ ...answers, [p]: e.target.value })}
                  autoComplete="off" placeholder={`kata ke-${p}`} />
              </div>
            ))}
            {error && <p className="error">{error}</p>}
            <button className="btn" onClick={finish} disabled={busy}>
              {busy ? 'Menyimpan vault terenkripsi…' : 'Selesai — simpan wallet'}
            </button>
            <p className="muted">
              Alamat wallet akan muncul setelah worker ai-server memverifikasi derive
              via opacra-wallet-cli (TODO-CLI). Sampai saat itu wallet berstatus
              “alamat belum diverifikasi” dan kirim dari wallet ini belum aktif.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
