import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * EasyUI Animated Number — angka yang bergerak mulus (spring) saat nilainya
 * berubah. Dipakai untuk saldo OPCA agar perubahan saldo terlihat hidup.
 */
export default function AnimatedNumber({
  value,
  decimals = 6,
  locale = 'id-ID',
  className,
}) {
  const mv = useMotionValue(Number(value) || 0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const text = useTransform(spring, (v) =>
    v.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }),
  );

  useEffect(() => {
    mv.set(Number(value) || 0);
  }, [value, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
