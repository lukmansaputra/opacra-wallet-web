import { AnimatePresence, motion } from 'framer-motion';
import { cn } from './cn.js';

/**
 * EasyUI Badge — API sesuai dokumentasi easyui.site/components/badge:
 * variant: 'soft' | 'solid' | 'outline' (default 'soft')
 * tone: 'neutral' | 'success' | 'warning' | 'danger' (default 'neutral')
 * dot: tampilkan titik status di depan
 * pulse: cincin pulse animasi pada titik status
 * onRemove: bila diisi, jadi chip yang bisa dihapus (tombol ×)
 * Angka/teks ikut "roll" (geser) saat nilainya berubah.
 */
const tones = {
  neutral: {
    soft: 'bg-slate-500/15 text-slate-300',
    solid: 'bg-slate-500 text-white',
    outline: 'border border-slate-500/50 text-slate-300',
  },
  success: {
    soft: 'bg-emerald-500/15 text-emerald-300',
    solid: 'bg-emerald-500 text-white',
    outline: 'border border-emerald-500/50 text-emerald-300',
  },
  warning: {
    soft: 'bg-amber-500/15 text-amber-300',
    solid: 'bg-amber-500 text-white',
    outline: 'border border-amber-500/50 text-amber-300',
  },
  danger: {
    soft: 'bg-red-500/15 text-red-300',
    solid: 'bg-red-500 text-white',
    outline: 'border border-red-500/50 text-red-300',
  },
};

const dotColors = {
  neutral: 'bg-slate-400',
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
  const key = typeof children === 'string' || typeof children === 'number' ? String(children) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold leading-none',
        tones[tone][variant] || tones[tone].soft,
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                dotColors[tone],
              )}
            />
          )}
          <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotColors[tone])} />
        </span>
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
