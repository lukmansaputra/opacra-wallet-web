import { cn } from './cn.js';

/**
 * Card — kartu polos ala wallet asli: permukaan #12161C, border 1px
 * putih 5%, sudut rounded-2xl. Tanpa spotlight, tanpa glow, tanpa gradasi.
 */
export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-white/5 bg-card p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}
