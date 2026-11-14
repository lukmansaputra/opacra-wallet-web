import { useState } from 'react';
import AnimatedNumber from './animated-number.jsx';
import { IconCheck, IconChevronRight, IconCopy, IconEye, IconEyeOff, IconReceive, IconRefresh, IconSend } from './icons.jsx';
import { cn } from './cn.js';

function fmt(n, locale = 'id-ID') {
  return Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 6 });
}

/**
 * Hero saldo ala wallet asli: angka besar tabular-nums, tombol mata untuk
 * menyembunyikan saldo, aksi cepat berupa tombol ikon bulat, dan rincian
 * saldo sebagai baris divider — tanpa gradasi, glow, atau kartu mini.
 * API sama seperti sebelumnya: user { name }, balance, locked, total,
 * height, synced, updatedAt, currency, locale, address,
 * onSend, onRequest, onViewAll (riwayat), onRefresh.
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
  const [hidden, setHidden] = useState(false);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  const actions = [
    { key: 'send', label: 'Kirim', icon: IconSend, onClick: onSend },
    { key: 'receive', label: 'Terima', icon: IconReceive, onClick: onRequest },
    { key: 'refresh', label: 'Refresh', icon: IconRefresh, onClick: onRefresh },
  ];

  return (
    <div className={cn('px-1 pt-2', className)}>
      {/* Baris wallet + status sinkron */}
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-white">
          {user?.name || 'Wallet Utama'}
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
          <span
            aria-hidden
            className={cn('h-1.5 w-1.5 rounded-full', synced ? 'bg-accent' : 'bg-white/30')}
          />
          {synced ? 'Tersinkron' : 'Belum sync'}
        </p>
      </div>

      {/* Saldo */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-muted">Saldo tersedia</p>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            className="rounded-md p-1 text-muted transition-colors hover:text-white"
          >
            {hidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          {hidden ? (
            <span className="text-[40px] font-semibold leading-none tracking-tight text-white tabular-nums sm:text-5xl">
              ••••••
            </span>
          ) : (
            <AnimatedNumber
              value={balance}
              locale={locale}
              className="text-[40px] font-semibold leading-none tracking-tight text-accent tabular-nums sm:text-5xl"
            />
          )}
          <span className="text-base font-semibold text-muted">{currency}</span>
        </div>
      </div>

      {/* Aksi cepat: tombol ikon bulat + label */}
      <div className="mt-6 flex items-start justify-center gap-6">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            className="group flex w-16 flex-col items-center gap-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors group-hover:bg-white/10 group-active:scale-95">
              <a.icon size={22} />
            </span>
            <span className="text-xs font-medium text-muted group-hover:text-white">
              {a.label}
            </span>
          </button>
        ))}
      </div>

      {/* Rincian saldo: baris divider */}
      <dl className="mt-7 divide-y divide-white/5 border-t border-white/5 text-sm">
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Terkunci</dt>
          <dd className="font-semibold tabular-nums">{fmt(locked, locale)} OPCA</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Total</dt>
          <dd className="font-semibold tabular-nums">{fmt(total, locale)} OPCA</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Tinggi blok</dt>
          <dd className="font-semibold tabular-nums">{height ?? '—'}</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Update terakhir</dt>
          <dd className="text-xs text-muted">
            {updatedAt ? new Date(updatedAt).toLocaleString('id-ID') : '—'}
          </dd>
        </div>
      </dl>

      {/* Alamat + riwayat */}
      {address && (
        <button
          type="button"
          onClick={copyAddress}
          className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
        >
          <span className="truncate font-mono text-xs text-muted">{address}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white">
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? 'Disalin' : 'Salin'}
          </span>
        </button>
      )}
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-3 flex w-full items-center justify-between py-1 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          Lihat riwayat
          <IconChevronRight size={16} className="text-muted" />
        </button>
      )}
    </div>
  );
}
