import { cn } from './cn.js';

/**
 * Segmented control datar (dipakai ImportWallet untuk mode seed/key).
 * API: tabs: [{ id, label, icon? }], value, onChange(id).
 * Aktif: latar putih 10% + teks putih; nonaktif: teks abu-abu.
 */
export default function AnimatedTabs({ tabs, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl border border-white/5 bg-white/[0.03] p-1',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              active ? 'bg-white/10 text-white' : 'text-muted hover:text-white',
            )}
          >
            <span className="relative flex items-center justify-center gap-1.5">
              {t.icon && <span aria-hidden>{t.icon}</span>}
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
