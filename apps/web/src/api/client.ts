import type {
  AuthResponse,
  CreateOrderInput,
  CreateProductInput,
  Order,
  PaginatedProducts,
  Product,
  ProductListQueryInput,
  SigninInput,
  SignupInput,
  UpdateProductInput,
  User,
} from '@sol25/shared';
import { getAuthToken } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class PaymentDeclinedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentDeclinedError';
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.error?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export function fetchProducts(query: ProductListQueryInput) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 20),
  });

  if (query.q) {
    params.set('q', query.q);
  }

  if (query.category) {
    params.set('category', query.category);
  }

  if (query.minPrice !== undefined) {
    params.set('minPrice', String(query.minPrice));
  }

  if (query.maxPrice !== undefined) {
    params.set('maxPrice', String(query.maxPrice));
  }

  if (query.sortBy) {
    params.set('sortBy', query.sortBy);
  }

  if (query.sortOrder) {
    params.set('sortOrder', query.sortOrder);
  }

  return request<PaginatedProducts>(`/products?${params}`);
}

export function fetchOrders() {
  return request<Order[]>('/orders');
}

export function createProduct(input: CreateProductInput) {
  return request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return request<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteProduct(id: string) {
  return request<Product>(`/products/${id}`, {
    method: 'DELETE',
  });
}

export async function createOrder(input: CreateOrderInput) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => ({}))) as Order | ApiErrorBody;

  if (response.status === 402) {
    const errorBody = body as ApiErrorBody;
    throw new PaymentDeclinedError(errorBody.error?.message ?? 'Payment declined');
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new Error(errorBody.error?.message ?? 'Request failed');
  }

  return body as Order;
}

export function fetchOrder(orderId: string) {
  return request<Order>(`/orders/${orderId}`);
}

export function signin(input: SigninInput) {
  return request<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function signup(input: SignupInput) {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchMe() {
  return request<User>('/auth/me');
}
