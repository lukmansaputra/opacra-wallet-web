# Worker — ai-server

Worker Node.js yang jalan di ai-server. Tugasnya tiga:

1. **Poll antrean kirim (tiap 5 detik):** ambil `wallet_send_requests`
   status `pending` → validasi ulang → verifikasi PIN → transfer via
   `opacra-wallet-cli` → update status `done`+txid / `failed`+error.
2. **Sync state (tiap 30 detik):** saldo + mining → upsert ke Supabase
   (`wallet_state`, `mining_stats`).
3. **Proses `wallet_requests` (tiap 5 detik):** derive alamat wallet baru.
   Lihat TODO-CLI di `src/walletRequests.js` — untuk wallet vault, derive
   belum bisa dilakukan worker karena secret-nya tidak ada di server.

Worker tidak membuka port. Ia hanya outbound HTTPS ke Supabase dan
memanggil wallet-cli lokal (127.0.0.1).

## PIN — baca dulu

- PIN 6 digit **wajib untuk setiap kirim**, tanpa pengecualian.
- PIN tidak disimpan plaintext di mana pun. Yang disimpan hanya **hash scrypt**
  di file `OPACRA_SEND_PIN_HASH_FILE` (dibuat via `scripts/set-pin.js`).
- Alur: frontend → backend Vercel → `pin_transient` di Supabase (sementara)
  → worker baca → verifikasi hash → **langsung hapus field itu (NULL)**,
  apa pun hasilnya (benar / salah / error).
- **Lockout:** 3x PIN salah berturut-turut → kirim dikunci 15 menit
  (`wallet_state.send_locked_until`, dicatat di `audit_log`). Worker yang
  enforce; backend juga menolak request baru selama kunci aktif (423).

## Install

```bash
cd ~/opacra-wallet-web/worker
npm install
cp .env.example .env
# isi .env dengan nilai asli (lihat .env.example). Jangan commit .env.
node scripts/set-pin.js   # buat PIN pertama kali (hash saja yang tersimpan)
node src/worker.js        # tes jalan sekali (Ctrl+C untuk berhenti)
```

## Set / ganti PIN

```bash
node scripts/set-pin.js
# masukkan PIN 6 digit 2x. Hash ditulis ke OPACRA_SEND_PIN_HASH_FILE (600).
sudo systemctl restart opacra-wallet-worker
```

## Systemd

```bash
sudo cp opacra-wallet-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now opacra-wallet-worker
sudo journalctl -u opacra-wallet-worker -f
```

## Catatan wallet-cli

Refresh mengikuti pola yang terbukti di ai-server: password wallet dialirkan
via file di stdin (`--command refresh < password-file`), bukan via argumen
CLI dan bukan via `cat`. Lihat `src/opacra.js`. Jangan pernah log password,
seed, atau PIN.
