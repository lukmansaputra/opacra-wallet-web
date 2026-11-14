-- Opacra Wallet Web — migrasi 001
-- Project Supabase: mqhcizucsiipjwodbwvl (dipakai bersama CryptoKu).
-- Tabel baru khusus Opacra (prefix wallet_/mining_/audit_log opacra tidak
-- dipakai CryptoKu — tapi audit_log di sini khusus wallet; bila CryptoKu
-- sudah punya audit_log dengan nama sama, rename tabel ini jadi
-- opacra_audit_log sebelum run. Cek dulu di SQL Editor.)
-- TIDAK ADA kolom seed / password / PIN plaintext di migrasi ini.
-- PIN hanya hidup sementara di wallet_send_requests.pin_transient dan
-- DIHAPUS (NULL) oleh worker setelah verifikasi; hash PIN hanya ada di
-- file lokal ai-server, bukan di database.
--
-- SETUP OWNER: setelah migrasi, isi owner_id di wallet_state (id=1) dan
-- mining_stats (id=1) dengan user_id Supabase Auth Lukmana:
--   update wallet_state set owner_id = '<user_id>' where id = 1;
--   update mining_stats set owner_id = '<user_id>' where id = 1;
-- Policy di bawah memakai auth.uid() = owner_id (owner-only).

-- ============ wallet_state (1 baris, id=1) ============
create table if not exists public.wallet_state (
  id int primary key,
  owner_id uuid,
  address text,
  balance numeric(20, 6) not null default 0,
  locked numeric(20, 6) not null default 0,
  total numeric(20, 6) not null default 0,
  height bigint,
  synced boolean not null default false,
  -- Lockout PIN: 3x salah -> kunci kirim 15 menit (worker yang enforce).
  failed_pin_attempts int not null default 0,
  last_pin_failure_at timestamptz,
  send_locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.wallet_state enable row level security;
drop policy if exists "owner-only" on public.wallet_state;
create policy "owner-only" on public.wallet_state
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- Baris awal (owner_id diisi manual setelah migrasi, lihat atas).
insert into public.wallet_state (id, owner_id, address, balance, locked, total, synced)
values (1, null, null, 0, 0, 0, false)
on conflict (id) do nothing;

-- ============ wallet_transactions (cache riwayat, ditulis worker) ============
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  txid text,
  direction text not null check (direction in ('in', 'out')),
  amount numeric(20, 6) not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists wallet_transactions_owner_created_idx
  on public.wallet_transactions (owner_id, created_at desc);
alter table public.wallet_transactions enable row level security;
drop policy if exists "owner-only" on public.wallet_transactions;
create policy "owner-only" on public.wallet_transactions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============ wallet_send_requests (antrean kirim) ============
create table if not exists public.wallet_send_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  to_address text not null,
  amount numeric(20, 6) not null check (amount > 0),
  -- PIN sementara: ditulis backend Vercel, HARUS di-NULL-kan worker
  -- segera setelah verifikasi (benar/salah/error). Jangan dibaca frontend.
  pin_transient text,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'failed')),
  txid text,
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists wallet_send_requests_pending_idx
  on public.wallet_send_requests (status, created_at) where status = 'pending';
alter table public.wallet_send_requests enable row level security;
drop policy if exists "owner-only" on public.wallet_send_requests;
create policy "owner-only" on public.wallet_send_requests
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============ mining_stats (1 baris, id=1) ============
create table if not exists public.mining_stats (
  id int primary key,
  owner_id uuid,
  status text not null default 'offline',
  pool text,
  hashrate numeric,
  blocks_found int not null default 0,
  uptime text,
  updated_at timestamptz not null default now()
);
alter table public.mining_stats enable row level security;
drop policy if exists "owner-only" on public.mining_stats;
create policy "owner-only" on public.mining_stats
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
insert into public.mining_stats (id, owner_id, status, pool, blocks_found)
values (1, null, 'offline', 'NurseryPool', 0)
on conflict (id) do nothing;

-- ============ address_book ============
create table if not exists public.address_book (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  label text not null,
  address text not null,
  created_at timestamptz not null default now()
);
alter table public.address_book enable row level security;
drop policy if exists "owner-only" on public.address_book;
create policy "owner-only" on public.address_book
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============ audit_log (jejak send / PIN gagal / lockout) ============
-- TIDAK menyimpan PIN / password / seed. Detail hanya id + jumlah + alamat.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  event text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_owner_created_idx
  on public.audit_log (owner_id, created_at desc);
alter table public.audit_log enable row level security;
drop policy if exists "owner-only" on public.audit_log;
create policy "owner-only" on public.audit_log
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
