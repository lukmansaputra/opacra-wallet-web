'use strict';
// Rate-limit sederhana in-memory per user+IP, untuk serverless.
// Catatan: di Vercel, instance serverless bisa di-recycle sehingga counter
// tidak persisten antar instance — ini lapisan pertama saja. Lapisan utama
// tetap lockout PIN di worker (wallet_state.send_locked_until) + validasi worker.
// Untuk rate-limit persisten, pindahkan ke tabel Supabase bila perlu.

const buckets = new Map(); // key -> { count, windowStart }

function rateLimit(key, limitPerMinute) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const b = buckets.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limitPerMinute - 1 };
  }
  if (b.count >= limitPerMinute) return { allowed: false, remaining: 0 };
  b.count += 1;
  return { allowed: true, remaining: limitPerMinute - b.count };
}

function sendRateLimitKey(req, userId) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  return `send:${userId}:${ip}`;
}

module.exports = { rateLimit, sendRateLimitKey };
