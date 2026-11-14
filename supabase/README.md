# Supabase — Opacra Wallet

Project: `mqhcizucsiipjwodbwvl` (dipakai bersama CryptoKu — tabel di sini
baru, prefix `wallet_` / `mining_` / `audit_log`, jangan ganggu tabel CryptoKu).

## Jalankan migrasi

Supabase Dashboard → SQL Editor → paste, berurutan:
`migrations/001_opacra_wallet.sql`, lalu `migrations/002_opacra_wallets.sql` → Run.

**Cek dulu:** kalau CryptoKu sudah punya tabel bernama `audit_log`, rename
tabel audit di migrasi ini jadi `opacra_audit_log` (tabel + semua referensi
di `backend/` dan `worker/`) sebelum run.

## Setup owner (WAJIB setelah migrasi)

Policy RLS di semua tabel adalah owner-only: `auth.uid() = owner_id`.
Isi `owner_id` dengan user_id Supabase Auth Lukmana:

```sql
-- ambil user_id dulu: Authentication → Users → salin User UID
update wallet_state set owner_id = '<user_id>' where id = 1;
update mining_stats set owner_id = '<user_id>' where id = 1;
```

Worker menulis baris baru dengan `owner_id` dari baris state yang sudah ada;
jadi isi owner_id di `wallet_state` dulu sebelum menjalankan worker pertama kali.

## Tabel

| Tabel | Isi |
|---|---|
| `wallet_state` (id=1) | Saldo cache + `failed_pin_attempts`, `send_locked_until` (lockout PIN) |
| `wallet_transactions` | Riwayat cache (ditulis worker) |
| `wallet_send_requests` | Antrean kirim; `pin_transient` = PIN sementara, worker HARUS men-NULL-kan setelah verifikasi |
| `mining_stats` (id=1) | Status mining cache |
| `address_book` | Label + alamat |
| `audit_log` | Jejak send / PIN gagal / lockout (tanpa PIN/password/seed) |
| `wallets` | Metadata wallet vault + `encrypted_vault` ciphertext `{salt,iv,ct}` (BUKAN plaintext) |
| `wallet_requests` | Antrean derive alamat (create/import) — diproses worker, lihat TODO-CLI di `worker/src/walletRequests.js` |

## PIN — catatan keamanan

- Tidak ada kolom PIN plaintext permanen. `pin_transient` hanya hidup
  beberapa detik (backend tulis → worker baca → worker NULL-kan).
- Hash PIN (scrypt) hanya ada di file lokal ai-server.
- Lockout: 3x PIN salah → `send_locked_until` = sekarang + 15 menit.
