import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from './cn.js';

/**
 * EasyUI Drag to Confirm — geser kenop sampai ujung untuk konfirmasi.
 * Dipakai sebagai langkah konfirmasi akhir kirim OPCA (pengganti klik kedua).
 * Ketuk kenop juga bisa dipakai sebagai fallback (mis. layar sentuh).
 */
export default function DragToConfirm({
  label = 'Geser untuk konfirmasi',
  confirmLabel = 'Terkonfirmasi ✓',
  disabled = false,
  onConfirm,
  className,
}) {
  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const knobOpacity = useTransform(x, [0, 160], [1, 0.55]);

  function maxX() {
    const w = trackRef.current?.clientWidth || 320;
    return Math.max(0, w - 64);
  }

  function handleDragEnd(_, info) {
    setDragging(false);
    if (disabled || done) return;
    if (info.offset.x >= maxX() * 0.85) {
      setDone(true);
      x.set(maxX());
      onConfirm?.();
    } else {
      x.set(0);
    }
  }

  function handleTap() {
    if (disabled || done) return;
    setDone(true);
    x.set(maxX());
    onConfirm?.();
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative flex h-14 w-full touch-none select-none items-center overflow-hidden rounded-2xl border',
        done
          ? 'border-accent/60 bg-accent/15'
          : 'border-line2 bg-card2',
        disabled && 'opacity-55',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pl-10 pr-4">
        <span className="text-sm font-bold text-muted">
          {done ? confirmLabel : dragging ? 'Terus geser…' : label}
        </span>
      </div>
      <motion.button
        type="button"
        aria-label={label}
        disabled={disabled || done}
        drag={disabled || done ? false : 'x'}
        dragConstraints={{ left: 0, right: maxX() }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x, opacity: knobOpacity }}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'relative z-10 ml-1 flex h-12 w-12 shrink-0 cursor-grab items-center justify-center rounded-xl text-lg font-black',
          done ? 'bg-accent text-[#06130a]' : 'bg-accent text-[#06130a] shadow-glow',
          'active:cursor-grabbing',
        )}
      >
        →
      </motion.button>
    </div>
  );
}
