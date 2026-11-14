-- Opacra Wallet Web — migrasi 002 (multi-wallet)
-- Jalankan SETELAH 001. Project: mqhcizucsiipjwodbwvl.
-- TIDAK ADA kolom seed / private key plaintext di migrasi ini.
-- wallets.encrypted_vault hanya berisi { salt, iv, ct } (AES-GCM, base64)
-- yang dibuat client-side. Server tidak pernah melihat isinya.

-- ============ wallets (wallet vault + metadata wallet server) ============
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  label text not null default 'Wallet',
  address text,
  source text not null default 'vault' check (source in ('server', 'vault')),
  -- Ciphertext vault terenkripsi client-side (salt/iv/ct). NULL untuk wallet server.
  encrypted_vault jsonb,
  derivation_status text not null default 'pending-cli'
    check (derivation_status in ('pending-cli', 'needs-cli', 'verified')),
  created_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists "owner-only" on public.wallets;
create policy "owner-only" on public.wallets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============ wallet_requests (antrean derive alamat) ============
create table if not exists public.wallet_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  wallet_id uuid references public.wallets (id) on delete cascade,
  kind text not null check (kind in ('create', 'import')),
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists wallet_requests_pending_idx
  on public.wallet_requests (status, created_at) where status = 'pending';
alter table public.wallet_requests enable row level security;
drop policy if exists "owner-only" on public.wallet_requests;
create policy "owner-only" on public.wallet_requests
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
