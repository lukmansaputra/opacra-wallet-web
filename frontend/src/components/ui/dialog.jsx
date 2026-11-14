import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX } from './icons.jsx';

/**
 * Dialog — modal bawah (sheet) di HP, terpusat di desktop.
 * Animasi spring halus, backdrop gelap. Tutup via backdrop / × / Escape.
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
            className="absolute inset-0 cursor-default bg-black/70"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md rounded-2xl border border-white/5 bg-card p-5"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="rounded-lg bg-white/5 p-1.5 text-muted hover:bg-white/10 hover:text-white"
              >
                <IconX size={16} />
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
