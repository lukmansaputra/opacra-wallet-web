# Opacra Wallet Web

Web wallet Opacra (OPCA) — frontend HP + desktop, backend Vercel, Supabase
sebagai antrean + cache, worker di ai-server sebagai eksekutor + sync.

Login utama: **Sign with Google** (Supabase Auth Google OAuth). Setelah login
ada onboarding: pakai **Wallet Utama** (ai-server), **Buat Wallet Baru**
(seed phrase 25 kata), atau **Import Wallet** (seed phrase / spend key).
Tampilan setelah itu seperti wallet pada umumnya: saldo, kirim, terima,
riwayat, mining, pengaturan.

> **Keamanan dulu:** seed / private key / password wallet TIDAK PERNAH keluar
> dari ai-server untuk wallet utama, dan TIDAK PERNAH disimpan plaintext di
> mana pun untuk wallet vault — kunci vault dienkripsi client-side (WebCrypto
> AES-GCM, kunci dari PBKDF2 password enkripsi user) sebelum disimpan.
> Repo ini tidak berisi secret apa pun. Semua secret hanya lewat environment
> variable di tempatnya masing-masing.

## Arsitektur

```
HP / Desktop
  │
  ▼  login: Sign with Google (Supabase Auth) — lapis pertama
Vercel — frontend/ (Vite + React, responsive)
  │  onboarding: Wallet Utama | Buat Wallet | Import Wallet
  │  VITE_API_URL = https://<backend-vercel>/api
  ▼
Vercel — backend/ (serverless functions, Node 20)
  │  - cek JWT Supabase Auth
  │  - validasi alamat Pa..., jumlah > 0, PIN 6 digit wajib, rate-limit
  │  - baca/tulis Supabase pakai SUPABASE_SERVICE_ROLE_KEY (server-side only)
  │  - tolak secret plaintext apa pun yang dikirim ke server
  ▼
Supabase — project mqhcizucsiipjwodbwvl (dipakai bersama CryptoKu,
             tabel opacra_* terpisah, jangan ganggu tabel CryptoKu)
  │  tabel: wallet_state, wallet_transactions, wallet_send_requests,
  │         mining_stats, address_book, audit_log,
  │         wallets (metadata + vault terenkripsi), wallet_requests
  │  RLS ON di semua tabel, hanya owner (authenticated user Lukmana)
  ▼ (worker ai-server poll tiap 5 detik, push tiap 30 detik)
ai-server (Ubuntu) — worker/
  │  - poll wallet_send_requests status=pending
  │  - validasi ulang + cek PIN (hash file lokal) + cek saldo
  │  - eksekusi transfer via opacra-wallet-cli (password via file di stdin)
  │  - push saldo / transaksi / mining ke Supabase
  │  - proses wallet_requests (derive alamat — lihat TODO-CLI di bawah)
  ▼
opacrad + opacra-wallet-cli (lokal, 127.0.0.1 saja)
XMRig pool NurseryPool (mining, terpisah dari wallet)
```

### Kenapa bukan Vercel fetch langsung ke ai-server?

1. ai-server ber-IP private Tailscale, di belakang NAT, tanpa IP publik.
   Vercel (internet publik) tidak bisa menjangkaunya.
2. Vercel serverless tidak bisa menjalankan full node `opacrad`
   (proses panjang, download blockchain, butuh disk persisten) dan tidak
   boleh menyimpan file wallet / seed (filesystem ephemeral, timeout
   10–60 detik).
3. Karena itu arahnya dibalik: **ai-server yang menghubungi Supabase**
   (outbound), Vercel tidak pernah membuka pintu masuk ke ai-server.

## Dua mode wallet

| | Wallet Utama (server) | Wallet vault (baru / import) |
|---|---|---|
| Seed disimpan di | ai-server saja, tidak pernah keluar | Browser → vault terenkripsi AES-GCM di Supabase (ciphertext `{salt,iv,ct}`) |
| Dibuat dari | Sudah ada (CLI di ai-server) | Web: generate 25 kata di browser / import seed / spend key |
| Saldo / kirim | ✅ Live via worker | ⏳ Menunggu derive + signer (TODO-CLI, lihat bawah) |
| Alamat | `Pa2TX…` (terverifikasi) | `pending-cli` sampai derive terverifikasi |

### Vault terenkripsi client-side (wallet baru / import)

- Seed / spend key dibuat atau dimasukkan **di browser**, lalu dienkripsi
  dengan password enkripsi user: PBKDF2 (600.000 iterasi, SHA-256) →
  AES-GCM 256-bit. Yang disimpan di Supabase hanya `{ salt, iv, ct }`.
- Server tidak pernah melihat password enkripsi maupun isi vault.
  Password enkripsi dipegang di memori saja selama sesi.
- Password enkripsi **bukan** PIN kirim — dua hal berbeda. PIN kirim tetap
  wajib 6 digit untuk setiap kirim dari wallet utama.

### Alur baca (saldo / riwayat / mining)

```
worker (tiap 30 detik) → upsert wallet_state, wallet_transactions,
                         mining_stats di Supabase
frontend → GET /api/balance (backend Vercel) → baca Supabase → tampil
```

### Alur kirim (write)

```
frontend → POST /api/send {to, amount, pin}
  → backend Vercel: cek JWT, validasi alamat/jumlah, rate-limit,
    tulis wallet_send_requests status=pending
worker (tiap 5 detik) → ambil pending → validasi ulang (alamat, jumlah,
  saldo via wallet-cli, PIN via hash file lokal) → transfer via
  wallet-cli → update status done+txid / failed+error
frontend → GET /api/send/:id → poll status sampai done/failed
```

PIN tidak pernah disimpan di Supabase / Vercel. Yang disimpan di ai-server
hanya **hash** PIN (file `OPACRA_SEND_PIN_HASH_FILE`), worker yang
membandingkan hash-nya.

## Struktur repo

```
opacra-wallet-web/
  README.md            — file ini
  LICENSE              — MIT
  .gitignore
  .env.example         — daftar variabel (tanpa nilai)
  frontend/            — Vite + React, deploy ke Vercel (static)
    src/
      main.jsx, App.jsx, styles.css
      supabaseClient.js (Google OAuth + api helper)
      walletStore.js (metadata wallet aktif — bukan secret)
      crypto/ mnemonic.js vault.js english-words.json README.md
      pages/ Login.jsx Onboarding.jsx CreateWallet.jsx ImportWallet.jsx
             Dashboard.jsx Send.jsx Receive.jsx History.jsx Mining.jsx Settings.jsx
  backend/             — Vercel serverless functions (Node 20)
    api/balance.js api/transactions.js api/mining.js
    api/send.js api/send/[id].js
    api/wallets.js api/wallets/[id].js api/wallets/derive.js
    lib/supabase.js lib/auth.js lib/validate.js lib/ratelimit.js
    vercel.json
  worker/              — Node worker untuk ai-server
    src/worker.js src/opacra.js src/supabase.js src/pin.js src/walletRequests.js
    scripts/set-pin.js
    opacra-wallet-worker.service (systemd contoh)
  supabase/
    migrations/001_opacra_wallet.sql migrations/002_opacra_wallets.sql
    README.md
```

## Deploy

### 0. Prasyarat (TODO user)

- [ ] Supabase project `mqhcizucsiipjwodbwvl` sudah ada (sudah, dipakai CryptoKu).
- [ ] Jalankan `supabase/migrations/001_opacra_wallet.sql` di SQL Editor
      Supabase (atau via `supabase db push` kalau pakai CLI).
- [ ] Di Supabase Auth: buat user Lukmana (email + password), catat
      `user_id`-nya. Isi `owner_id` di tabel dengan user_id itu
      (lihat `supabase/README.md` — policy owner-only).
- [ ] Buat PIN kirim: di ai-server, buat hash PIN dan simpan di file yang
      ditunjuk `OPACRA_SEND_PIN_HASH_FILE` (lihat `worker/README.md`).
      **Jangan tulis PIN / hash di repo, chat, atau Vercel env.**
- [ ] Wallet Opacra di ai-server sudah ada dan sudah `refresh` minimal sekali.

### 1. Supabase — migrasi + Google OAuth

Jalankan di SQL Editor Supabase, berurutan:
`supabase/migrations/001_opacra_wallet.sql`, lalu
`supabase/migrations/002_opacra_wallets.sql`.
Verifikasi: 8 tabel terbentuk, RLS enabled, policy `owner-only` ada.

Google OAuth (login utama):
1. Google Cloud Console → buat OAuth Client ID (Web) → isi Authorized
   redirect URI `https://mqhcizucsiipjwodbwvl.supabase.co/auth/v1/callback`.
2. Supabase Dashboard → Authentication → Providers → Google → ON,
   isi Client ID + Client Secret dari langkah 1.
3. Supabase Dashboard → Authentication → URL Configuration → Site URL =
   URL frontend Vercel, Redirect URLs tambahkan URL frontend Vercel.
4. Email/password tetap tersedia sebagai fallback login di halaman Login.

### 2. Backend — deploy ke Vercel

1. Import repo ini ke Vercel sebagai project baru (atau import subfolder
   `backend/` — lihat `backend/vercel.json`).
2. Set environment variables di Vercel (Production):
   - `SUPABASE_URL` — contoh `https://mqhcizucsiipjwodbwvl.supabase.co`
     (isi dari Dashboard Supabase → Settings → API).
   - `SUPABASE_SERVICE_ROLE_KEY` — secret key dari Dashboard yang sama.
     **Server-side only. Jangan pernah pakai key ini di frontend.**
   - `SUPABASE_ANON_KEY` — anon key (untuk verifikasi JWT, boleh di backend).
   - `SEND_RATE_LIMIT_PER_MINUTE` — opsional, default `5`.
   - `MAX_SEND_OPCA` — opsional, limit per transaksi, default `10`.
3. Deploy. Catat URL backend, misal `https://opacra-wallet-api.vercel.app`.
4. Endpoint yang tersedia:
   - `GET /api/balance`, `GET /api/transactions`, `GET /api/mining`
   - `POST /api/send`, `GET /api/send/:id`
   - `GET /api/wallets`, `POST /api/wallets`, `GET /api/wallets/:id`,
     `DELETE /api/wallets/:id`, `POST /api/wallets/derive`

### 3. Frontend — deploy ke Vercel

1. Import repo ini ke Vercel sebagai project kedua, root directory
   `frontend/`, framework preset **Vite**.
2. Set environment variable:
   - `VITE_API_URL` — `https://<url-backend-baru>/api`
     (VITE_* di-inline saat build — ganti nilai = redeploy.)
   - `VITE_SUPABASE_URL` — URL Supabase yang sama (untuk Auth login).
   - `VITE_SUPABASE_ANON_KEY` — **anon key saja**, bukan service_role.
3. Deploy. Buka URL frontend, login dengan **Google**, lalu onboarding:
   pilih Wallet Utama, atau Buat / Import wallet baru.

### 4. Worker — install di ai-server

Lihat `worker/README.md` lengkap. Ringkasnya:

```bash
# di ai-server
cd ~/opacra-wallet-web/worker
npm install
cp .env.example .env   # lalu isi dengan nilai asli, jangan commit
# isi: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPACRA_WALLET_CLI,
#      OPACRA_WALLET_FILE, OPACRA_WALLET_PASSWORD_FILE,
#      OPACRA_SEND_PIN_HASH_FILE, OPACRA_DAEMON_HOST, dsb.
node src/worker.js     # tes sekali jalan (dry-run dulu, lihat log)

# kalau sudah yakin, pasang systemd:
sudo cp opacra-wallet-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now opacra-wallet-worker
sudo journalctl -u opacra-wallet-worker -f
```

Worker TIDAK membuka port apa pun. Ia hanya outbound ke Supabase
(HTTPS) dan ke `opacra-wallet-cli` / `opacrad` lokal (127.0.0.1).

## Jalanin lokal (development)

```bash
# frontend
cd frontend && npm install && npm run dev
# buka http://localhost:5173 — butuh VITE_API_URL ke backend (lokal/Vercel)
# + VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY

# backend (Vercel dev, butuh Vercel CLI) atau tes fungsi langsung:
cd backend && npm install && node --check api/send.js

# worker (butuh .env + wallet-cli di mesin yang sama — idealnya ai-server)
cd worker && npm install && node --check src/worker.js
```

## PIN — WAJIB (web ini publik)

- **PIN 6 digit WAJIB untuk SETIAP kirim OPCA, tanpa pengecualian.**
  Backend Vercel menolak request tanpa PIN (400), worker menolak tanpa PIN
  juga (defense in depth).
- PIN tidak pernah disimpan plaintext di mana pun: tidak di Supabase, tidak
  di Vercel, tidak di GitHub, tidak di log. Hanya **hash scrypt** di file
  lokal ai-server (`OPACRA_SEND_PIN_HASH_FILE`).
- Alur: frontend kirim PIN via HTTPS ke backend Vercel → backend teruskan
  sebagai field sementara `pin_transient` di `wallet_send_requests` →
  worker ai-server verifikasi hash-nya → worker **HAPUS field PIN itu
  (update jadi NULL)** segera setelah verifikasi, apa pun hasilnya.
- **Lockout:** 3x PIN salah berturut-turut → kirim dikunci 15 menit
  (`wallet_state.send_locked_until`, dicatat di `audit_log`). Worker yang
  enforce; backend menolak request baru selama kunci aktif (HTTP 423) dan
  frontend menampilkan pesan kunci + waktu dibuka.
- **Set PIN pertama kali / ganti PIN:** hanya via worker di ai-server,
  bukan via web (lihat `worker/README.md`):
  `node scripts/set-pin.js` → restart worker.
  Jangan pernah kirim PIN lewat chat / commit / env Vercel.

## Yang jujur belum selesai (TODO — jangan dipakai dana besar dulu)

1. **TODO-CLI-VERIFY (mnemonic):** generate/validasi 25 kata di web memakai
   wordlist + checksum Monero dan sudah lolos round-trip test, tapi BELUM
   diverifikasi silang dengan `opacra-wallet-cli`. Sebelum wallet baru dipakai
   dana besar: restore seed-nya di CLI ai-server, pastikan alamatnya sama
   dengan alamat di web. Lihat `frontend/src/crypto/README.md`.
2. **TODO-CLI (derive alamat vault):** alamat wallet vault baru/import belum
   bisa di-derive otomatis — worker tidak punya secret-nya (dan secret tidak
   boleh dikirim ke server). Opsi: derive client-side di browser (butuh
   implementasi kunci Monero keccak+ed25519 di JS) atau channel sekali-pakai
   terenkripsi ke worker. Lihat `worker/src/walletRequests.js`.
3. **TODO-CLI/SIGNER (kirim dari wallet vault):** kirim saat ini hanya aktif
   untuk Wallet Utama (worker menandatangani via CLI di ai-server). Wallet
   vault belum bisa kirim sampai signer-nya dibangun.
4. **TODO (ganti password enkripsi vault):** belum ada — bila password hilang,
   vault tidak bisa dibuka; solusinya buat wallet baru dari seed yang dicatat.

## Keamanan — checklist

- [ ] RLS ON di semua 8 tabel, policy owner-only.
- [ ] Google OAuth aktif di Supabase, Site URL = URL frontend Vercel.
- [ ] `service_role` key HANYA di Vercel env backend + `.env` worker ai-server.
- [ ] Tidak ada secret di `VITE_*`, di frontend bundle, atau di Git.
- [ ] Seed / password wallet tidak ada di repo ini dalam bentuk apa pun.
- [ ] Wallet RPC / daemon bind `127.0.0.1` saja.
- [ ] File wallet dan file password di ai-server permission `600`.
- [ ] PIN kirim hanya sebagai hash di ai-server, dicek worker.
- [ ] Kirim dibatasi: jumlah > 0, alamat `Pa...` valid, limit per transaksi
      (`MAX_SEND_OPCA`), rate-limit per menit.
- [ ] Log worker tidak pernah mencetak password / seed / PIN.
- [ ] Audit log: setiap send-request tercatat di `audit_log`.

## Batasan yang diketahui

- Saldo / riwayat yang tampil di web adalah **cache dari Supabase**,
  di-sync worker tiap 30 detik — bukan live RPC. Bisa tertinggal
  beberapa detik dari chain.
- Kirim bersifat **asinkron** (antrean): status awal `pending`, worker
  mengeksekusi dalam ≤ 5–10 detik. Frontend harus poll `GET /api/send/:id`.
- Harga OPCA: belum ada listing / pool harga — wallet menampilkan OPCA
  saja, tanpa konversi Rupiah.
- Mining stats berasal dari log XMRig / `opacrad` lokal; kalau XMRig
  mati, worker menulis `mining_status=offline` (bukan error fatal).

## Lisensi

MIT — lihat `LICENSE`.
