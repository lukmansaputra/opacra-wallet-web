import { cn } from './cn.js';

/**
 * Button — tombol polos ala wallet asli. Tanpa efek magnet / glow.
 * Varian: primary (emerald, hanya untuk aksi utama) | secondary |
 * ghost | danger.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-accent text-[#06130A] font-semibold hover:bg-[#2BD968] active:bg-accentdeep',
    secondary:
      'bg-white/5 text-text border border-white/10 hover:bg-white/10',
    ghost: 'bg-transparent text-muted hover:text-text hover:bg-white/5',
    danger: 'bg-danger text-white font-semibold hover:bg-[#DC2626]',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[13px] rounded-lg',
    md: 'px-4 py-3 text-[15px] rounded-xl',
    lg: 'px-5 py-3.5 text-base rounded-xl',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 transition-colors active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
