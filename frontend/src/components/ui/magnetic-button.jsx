import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from './cn.js';

/**
 * EasyUI Magnetic Button — tombol yang "tertarik" mengikuti kursor (spring),
 * diadaptasi ke JSX. Varian: primary | secondary | ghost | danger.
 * Efek magnet nonaktif saat disabled atau di layar sentuh (tanpa hover).
 */
export default function MagneticButton({
  variant = 'primary',
  size = 'md',
  magnetic = true,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

  function onMove(e) {
    if (!magnetic || disabled || e.pointerType !== 'mouse') return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.28);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  const variants = {
    primary:
      'bg-accent text-[#06130a] font-bold shadow-glow hover:bg-[#2bd968] active:bg-accentdeep',
    secondary:
      'bg-card2 text-text border border-line2 hover:border-accent/50 hover:bg-[#222f26]',
    ghost: 'bg-transparent text-muted hover:text-text hover:bg-white/5',
    danger: 'bg-danger text-white font-bold hover:bg-[#dc2626]',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[13px] rounded-xl',
    md: 'px-4 py-3 text-[15px] rounded-2xl',
    lg: 'px-5 py-3.5 text-base rounded-2xl',
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      style={{ x: sx, y: sy }}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
