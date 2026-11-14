import { cn } from './cn.js';

/** Skeleton loading — blok berdenyut untuk state memuat. */
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-white/[0.06]', className)}
    />
  );
}
