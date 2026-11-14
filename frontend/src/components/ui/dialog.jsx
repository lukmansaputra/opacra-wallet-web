import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * EasyUI Morphing Dialog — modal dengan animasi spring (skala + naik),
 * backdrop blur, tutup via backdrop / tombol × / tombol Escape.
 */
export default function Dialog({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md rounded-3xl border border-line bg-card p-5 shadow-card"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              {title && <h3 className="text-lg font-extrabold">{title}</h3>}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="rounded-full bg-white/5 px-2.5 py-1 text-muted hover:bg-white/10 hover:text-text"
              >
                ✕
              </button>
            </div>
            {children}
            {footer && <div className="mt-5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
