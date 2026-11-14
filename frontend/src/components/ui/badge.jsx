import { AnimatePresence, motion } from 'framer-motion';
import { cn } from './cn.js';

/**
 * Badge — API: variant 'soft' | 'solid' | 'outline' (default 'soft'),
 * tone 'neutral' | 'success' | 'warning' | 'danger', dot (titik status
 * statis, tanpa cincin pulse), onRemove (chip yang bisa dihapus).
 * Angka/teks ikut geser halus saat nilainya berubah.
 */
const tones = {
  neutral: {
    soft: 'bg-white/5 text-white/70',
    solid: 'bg-white/15 text-white',
    outline: 'border border-white/15 text-white/70',
  },
  success: {
    soft: 'bg-emerald-500/10 text-emerald-400',
    solid: 'bg-emerald-500 text-white',
    outline: 'border border-emerald-500/40 text-emerald-400',
  },
  warning: {
    soft: 'bg-amber-500/10 text-amber-400',
    solid: 'bg-amber-500 text-white',
    outline: 'border border-amber-500/40 text-amber-400',
  },
  danger: {
    soft: 'bg-red-500/10 text-red-400',
    solid: 'bg-red-500 text-white',
    outline: 'border border-red-500/40 text-red-400',
  },
};

const dotColors = {
  neutral: 'bg-white/40',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
};

export default function Badge({
  variant = 'soft',
  tone = 'neutral',
  dot = false,
  pulse = false,
  onRemove,
  children,
  className,
}) {
  // `pulse` dipertahankan untuk kompatibilitas API, tapi tidak lagi
  // merender cincin ping — titik status kini statis.
  void pulse;
  const key = typeof children === 'string' || typeof children === 'number' ? String(children) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        tones[tone][variant] || tones[tone].soft,
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColors[tone])} />
      )}
      {key !== null ? (
        <span className="relative inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={key}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : (
        children
      )}
      {onRemove && (
        <button
          type="button"
          aria-label="Hapus"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
