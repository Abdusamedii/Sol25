import type { User } from '@sol25/shared';

const STORAGE_KEY = 'sol25:user';
const listeners = new Set<() => void>();

function readInitial(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

let current: User | null = readInitial();

export function getCurrentUser(): User | null {
  return current;
}

export function setCurrentUser(user: User | null) {
  current = user;

  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
