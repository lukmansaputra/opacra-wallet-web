import { clsx } from 'clsx';

/** Gabung class name (utilitas cn ala shadcn/EasyUI, tanpa tailwind-merge). */
export function cn(...inputs) {
  return clsx(...inputs);
}
