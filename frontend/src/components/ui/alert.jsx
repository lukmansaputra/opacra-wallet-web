import { motion } from 'framer-motion';
import { IconAlertTriangle, IconCheck, IconInfo } from './icons.jsx';
import { cn } from './cn.js';

/** Alert — pesan error / sukses / info / peringatan dengan animasi masuk. */
const tones = {
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  info: 'border-white/10 bg-white/5 text-white/80',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

const marks = {
  error: IconAlertTriangle,
  success: IconCheck,
  info: IconInfo,
  warning: IconAlertTriangle,
};

export default function Alert({ tone = 'info', children, className }) {
  const Mark = marks[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed',
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        <Mark size={16} />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </motion.div>
  );
}
