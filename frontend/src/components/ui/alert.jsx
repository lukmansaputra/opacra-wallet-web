import { motion } from 'framer-motion';
import { cn } from './cn.js';

/** Alert — pesan error / sukses / info / peringatan dengan animasi masuk. */
const tones = {
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
};

const marks = { error: '!', success: '✓', info: 'i', warning: '⚠' };

export default function Alert({ tone = 'info', children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-sm leading-relaxed',
        tones[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black"
      >
        {marks[tone]}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </motion.div>
  );
}
