import { motion } from 'framer-motion';
import { cn } from './cn.js';

/**
 * Input — label, hint, dan state error.
 * `invalid` + `error` menampilkan pesan error merah dengan animasi masuk.
 */
export default function Input({
  label,
  hint,
  error,
  invalid,
  id,
  className,
  inputClassName,
  ...props
}) {
  const hasError = invalid || !!error;
  return (
    <div className={cn('mt-4 first:mt-0', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[13px] font-medium text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={hasError || undefined}
        className={cn(
          'w-full rounded-xl border bg-white/[0.03] px-3.5 py-3 text-[15px] text-white',
          'placeholder:text-muted/50',
          'transition focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent/20',
          hasError
            ? 'border-danger/60 focus:border-danger focus:ring-danger/20'
            : 'border-white/10',
          inputClassName,
        )}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-[13px] font-medium text-red-400"
        >
          {error}
        </motion.p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
