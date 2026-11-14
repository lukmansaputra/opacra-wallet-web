import { motion } from 'framer-motion';
import { cn } from './cn.js';

/**
 * EasyUI Input — input dengan label, hint, dan state error.
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
          className="mb-1.5 block text-[13px] font-semibold text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={hasError || undefined}
        className={cn(
          'w-full rounded-2xl border bg-card2 px-3.5 py-3 text-[15px] text-text',
          'placeholder:text-muted/60',
          'transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30',
          hasError
            ? 'border-danger/70 focus:border-danger focus:ring-danger/30'
            : 'border-line',
          inputClassName,
        )}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-[13px] font-medium text-red-300"
        >
          {error}
        </motion.p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
