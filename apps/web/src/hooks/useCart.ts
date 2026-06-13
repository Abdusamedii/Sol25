import { useSyncExternalStore } from 'react';
import { getCart, subscribe } from '../lib/cart';

export function useCart() {
  return useSyncExternalStore(subscribe, getCart, () => []);
}
