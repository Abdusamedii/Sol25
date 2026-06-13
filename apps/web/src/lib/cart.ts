import type { Product } from '@sol25/shared';

const STORAGE_KEY = 'sol25:cart';

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  quantity: number;
};

const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedCart: CartItem[] = [];

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readCartFromStorage(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === cachedRaw) {
    return cachedCart;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedCart = [];
    return cachedCart;
  }

  try {
    cachedCart = JSON.parse(raw) as CartItem[];
    return cachedCart;
  } catch {
    cachedCart = [];
    return cachedCart;
  }
}

function writeCart(items: CartItem[]) {
  const raw = JSON.stringify(items);

  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedCart = items;
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCart(): CartItem[] {
  return readCartFromStorage();
}

export function addToCart(product: Product, quantity = 1) {
  const cart = readCartFromStorage();
  const existing = cart.find((item) => item.productId === product.id);
  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.stockQuantity);

  if (nextQuantity <= 0) {
    return;
  }

  const nextItem: CartItem = {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    stockQuantity: product.stockQuantity,
    quantity: nextQuantity,
  };

  if (existing) {
    writeCart(cart.map((item) => (item.productId === product.id ? nextItem : item)));
    return;
  }

  writeCart([...cart, nextItem]);
}

export function updateCartItemQuantity(productId: string, quantity: number) {
  const cart = readCartFromStorage();
  const item = cart.find((entry) => entry.productId === productId);

  if (!item) {
    return;
  }

  if (quantity <= 0) {
    writeCart(cart.filter((entry) => entry.productId !== productId));
    return;
  }

  const nextQuantity = Math.min(quantity, item.stockQuantity);

  if (nextQuantity === item.quantity) {
    return;
  }

  writeCart(
    cart.map((entry) =>
      entry.productId === productId
        ? {
            ...entry,
            quantity: nextQuantity,
          }
        : entry,
    ),
  );
}

export function removeFromCart(productId: string) {
  writeCart(readCartFromStorage().filter((item) => item.productId !== productId));
}

export function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedCart = [];
  emit();
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
