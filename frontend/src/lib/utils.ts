import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'sess_default_ssr';
  let sid = localStorage.getItem('merchantpilot_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('merchantpilot_session_id', sid);
  }
  return sid;
}
