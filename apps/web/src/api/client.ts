import type {
  CreateOrderInput,
  CreateProductInput,
  Order,
  Product,
  SigninInput,
  SignupInput,
  UpdateProductInput,
  User,
} from '@sol25/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.error?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export function fetchProducts() {
  return request<Product[]>('/products');
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

export function createOrder(input: CreateOrderInput) {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function signin(input: SigninInput) {
  return request<User>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function signup(input: SignupInput) {
  return request<User>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
