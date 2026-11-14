import { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from './cn.js';

/**
 * EasyUI Spotlight Card — kartu dengan sorotan radial yang mengikuti kursor,
 * diadaptasi ke JSX. `spotlight` bisa dimatikan (jadi kartu polos).
 */
export default function SpotlightCard({
  className,
  children,
  spotlight = true,
  spotlightColor = 'rgba(34, 197, 94, 0.16)',
  ...props
}) {
  const ref = useRef(null);
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const [hover, setHover] = useState(false);
  const bg = useMotionTemplate`radial-gradient(320px circle at ${mx}px ${my}px, ${spotlightColor}, transparent 70%)`;

  function onMove(e) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  return (
    <div
      ref={ref}
      onPointerMove={spotlight ? onMove : undefined}
      onPointerEnter={spotlight ? () => setHover(true) : undefined}
      onPointerLeave={spotlight ? () => setHover(false) : undefined}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-card',
        className,
      )}
      {...props}
    >
      {spotlight && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: bg }}
          animate={{ opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
