import { cn } from './cn.js';

/** Skeleton loading (EasyUI) — blok berdenyut untuk state memuat. */
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-2xl bg-white/[0.07]', className)}
    />
  );
}
