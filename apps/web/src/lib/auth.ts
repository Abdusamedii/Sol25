import type { User } from '@sol25/shared';

const USER_STORAGE_KEY = 'sol25:user';
const TOKEN_STORAGE_KEY = 'sol25:token';
const listeners = new Set<() => void>();

function readInitialUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function readInitialToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

let currentUser: User | null = readInitialUser();
let currentToken: string | null = readInitialToken();

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function isAdmin(user: User | null = currentUser): boolean {
  return user?.role === 'admin';
}

export function setAuthSession(user: User | null, token: string | null) {
  currentUser = user;
  currentToken = token;

  if (user && token) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  for (const listener of listeners) {
    listener();
  }
}

export function setCurrentUser(user: User | null) {
  setAuthSession(user, user ? currentToken : null);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
