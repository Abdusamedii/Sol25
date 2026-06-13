import type { CreateOrderInput } from '@sol25/shared';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useProducts } from '../hooks/useProducts';

export const Route = createFileRoute('/order')({
  component: CreateOrderPage,
});

function CreateOrderPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const products = useProducts();
  const createOrder = useCreateOrder();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const selectedItems = useMemo<CreateOrderInput['items']>(() => {
    return Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
  }, [quantities]);

  const estimatedTotal = useMemo(() => {
    if (!products.data) {
      return 0;
    }

    return products.data.reduce((total, product) => {
      return total + product.price * (quantities[product.id] ?? 0);
    }, 0);
  }, [products.data, quantities]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    const order = await createOrder.mutateAsync({
      userId: currentUser.id,
      items: selectedItems,
    });

    sessionStorage.setItem(`order:${order.id}`, JSON.stringify(order));
    await navigate({ to: '/order/$orderId', params: { orderId: order.id } });
  }

  if (!currentUser) {
    return (
      <section className="panel">
        <p className="eyebrow">Create order</p>
        <h2>Sign in to place an order</h2>
        <Link to="/signin" className="button">
          Sign in
        </Link>
      </section>
    );
  }

  if (products.isPending) {
    return <section className="panel">Loading products...</section>;
  }

  if (products.isError) {
    return <section className="panel error">{products.error.message}</section>;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Create order</p>
          <h2>Select products and quantities</h2>
        </div>
        <strong>${estimatedTotal.toFixed(2)}</strong>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        {products.data.map((product) => (
          <label key={product.id} className="order-row">
            <span>
              <strong>{product.name}</strong>
              <small>
                {product.sku} · {product.stockQuantity} in stock · ${product.price.toFixed(2)}
              </small>
            </span>
            <input
              min="0"
              max={product.stockQuantity}
              type="number"
              value={quantities[product.id] ?? 0}
              onChange={(event) => {
                setQuantities((current) => ({
                  ...current,
                  [product.id]: Number(event.target.value),
                }));
              }}
            />
          </label>
        ))}

        {createOrder.isError ? <p className="error">{createOrder.error.message}</p> : null}

        <button className="button" disabled={selectedItems.length === 0 || createOrder.isPending} type="submit">
          {createOrder.isPending ? 'Placing order...' : 'Place order'}
        </button>
      </form>
    </section>
  );
}
