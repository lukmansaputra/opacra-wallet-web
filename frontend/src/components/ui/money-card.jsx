import { useState } from 'react';
import { motion } from 'framer-motion';
import SpotlightCard from './spotlight-card.jsx';
import AnimatedNumber from './animated-number.jsx';
import Badge from './badge.jsx';
import MagneticButton from './magnetic-button.jsx';
import { cn } from './cn.js';

function fmt(n, locale = 'id-ID') {
  return Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 6 });
}

/**
 * EasyUI Money Card — kartu dompet interaktif dengan saldo yang beranimasi
 * live, aksi cepat, dan info sinkronisasi. Diadaptasi ke JSX + OPCA:
 * API mengikuti easyui.site/components/money-card:
 * user { name, avatar }, balance, currency, locale,
 * onSend (kirim), onRequest (terima), onViewAll (lihat semua / riwayat).
 * Tambahan khusus Opacra: locked, total, height, synced, updatedAt, address.
 */
export default function MoneyCard({
  user,
  balance = 0,
  locked = 0,
  total = 0,
  height = null,
  synced = false,
  updatedAt = null,
  currency = 'OPCA',
  locale = 'id-ID',
  onSend,
  onRequest,
  onViewAll,
  onRefresh,
  address = '',
  className,
}) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  return (
    <SpotlightCard
      className={cn(
        'bg-gradient-to-br from-[#12271a] via-card to-[#0d1a24] p-0',
        className,
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-xl font-black text-accent">
              {user?.avatar || '◈'}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{user?.name || 'Wallet Utama'}</p>
              <p className="text-xs text-muted">Dompet Opacra · ai-server</p>
            </div>
          </div>
          <Badge
            tone={synced ? 'success' : 'neutral'}
            dot={synced}
            pulse={synced}
          >
            {synced ? 'Tersinkron' : 'Belum sync'}
          </Badge>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted">
          Saldo tersedia
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <AnimatedNumber
            value={balance}
            locale={locale}
            className="text-[42px] font-extrabold leading-none tracking-tight text-white sm:text-5xl"
          />
          <span className="text-lg font-bold text-accent">{currency}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/[0.04] px-2 py-2.5">
            <p className="text-[11px] text-muted">Terkunci</p>
            <p className="truncate text-sm font-bold">{fmt(locked, locale)}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-2 py-2.5">
            <p className="text-[11px] text-muted">Total</p>
            <p className="truncate text-sm font-bold">{fmt(total, locale)}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-2 py-2.5">
            <p className="text-[11px] text-muted">Tinggi blok</p>
            <p className="truncate text-sm font-bold">{height ?? '—'}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <MagneticButton size="md" onClick={onSend} className="flex-1">
            ↑ Kirim
          </MagneticButton>
          <MagneticButton size="md" variant="secondary" onClick={onRequest} className="flex-1">
            ↓ Terima
          </MagneticButton>
          <MagneticButton
            size="md"
            variant="secondary"
            onClick={onRefresh}
            className="w-auto px-4"
            aria-label="Refresh saldo"
          >
            ↻
          </MagneticButton>
        </div>

        {address && (
          <button
            type="button"
            onClick={copyAddress}
            className="mt-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-line bg-black/30 px-3 py-2.5 text-left transition-colors hover:border-accent/40"
          >
            <span className="truncate font-mono text-xs text-muted">{address}</span>
            <span className="shrink-0 text-xs font-bold text-accent">
              {copied ? 'Disalin ✓' : 'Salin'}
            </span>
          </button>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted">
          <span>
            Update terakhir:{' '}
            {updatedAt ? new Date(updatedAt).toLocaleString('id-ID') : '—'}
          </span>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="font-bold text-sky hover:underline"
            >
              Lihat riwayat →
            </button>
          )}
        </div>
      </div>
      <motion.div
        aria-hidden
        className="h-1 bg-gradient-to-r from-accent via-emerald-300 to-sky"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      />
    </SpotlightCard>
  );
}
