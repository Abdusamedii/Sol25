import type {
  CreateOrderInput,
  CreatePaymentInput,
  CreateProductInput,
  Order,
  PaginatedProducts,
  PayOrderResponse,
  Product,
  ProductListQueryInput,
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
    details?: PayOrderResponse;
  };
};

export class PaymentDeclinedError extends Error {
  readonly details: PayOrderResponse;

  constructor(message: string, details: PayOrderResponse) {
    super(message);
    this.name = 'PaymentDeclinedError';
    this.details = details;
  }
}

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

export function fetchOrder(orderId: string) {
  return request<Order>(`/orders/${orderId}`);
}

export async function payOrder(orderId: string, input: CreatePaymentInput) {
  const response = await fetch(`${API_URL}/orders/${orderId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => ({}))) as PayOrderResponse | ApiErrorBody;

  if (response.status === 402) {
    const errorBody = body as ApiErrorBody;

    if (errorBody.error?.details) {
      throw new PaymentDeclinedError(errorBody.error.message ?? 'Payment declined', errorBody.error.details);
    }
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new Error(errorBody.error?.message ?? 'Request failed');
  }

  return body as PayOrderResponse;
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
