import { motion } from 'framer-motion';
import { cn } from './cn.js';

/**
 * EasyUI Animated Tabs — tab dengan indikator "pill" yang bergeser mulus
 * (layoutId) antar item aktif, sesuai API easyui.site:
 * tabs: [{ id, label, icon? }], value, onChange(id).
 * Konten di-cross-fade oleh parent (AnimatePresence di App).
 */
export default function AnimatedTabs({ tabs, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-2xl border border-line bg-moss/80 p-1',
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
              'relative flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
              active ? 'text-[#06130a]' : 'text-muted hover:text-text',
            )}
          >
            {active && (
              <motion.span
                layoutId="easyui-tab-pill"
                className="absolute inset-0 rounded-xl bg-accent shadow-glow"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              />
            )}
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
