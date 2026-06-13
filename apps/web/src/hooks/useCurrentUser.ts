import { useSyncExternalStore } from 'react';
import { getCurrentUser, subscribe } from '../lib/auth';

export function useCurrentUser() {
  return useSyncExternalStore(subscribe, getCurrentUser, () => null);
}
