import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn/ui's class joiner: later Tailwind classes win over earlier ones they conflict with. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
