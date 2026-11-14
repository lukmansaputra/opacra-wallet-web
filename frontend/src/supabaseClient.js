import { createClient } from '@supabase/supabase-js';

// Anon key BOLEH di frontend (publik by design). Keamanan dijaga RLS + Auth.
// JANGAN pernah pakai service_role key di sini.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[opacra] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum disetel');
}

export const supabase = createClient(url || '', anonKey || '');

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Login utama: Sign with Google (Supabase Auth Google OAuth).
 *  Setup: Supabase Dashboard → Authentication → Providers → Google → isi
 *  Client ID/Secret (Google Cloud Console), dan tambahkan redirect URL
 *  https://<project>.supabase.co/auth/v1/callback + URL frontend Vercel
 *  ke Authorized redirect URIs. */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Panggil backend Vercel (bukan Supabase langsung untuk data wallet). */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
