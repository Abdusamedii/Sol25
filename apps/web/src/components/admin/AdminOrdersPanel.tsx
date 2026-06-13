import type { Order } from '@sol25/shared';
import { Link } from '@tanstack/react-router';
import { ShoppingBag } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';

const statusColors: Record<Order['status'], string> = {
  pending_payment: 'bg-primary text-white',
  paid: 'bg-secondary text-white',
  payment_failed: 'bg-accent text-white',
  cancelled: 'bg-muted text-foreground',
};

export function AdminOrdersPanel() {
  const orders = useOrders();

  if (orders.isPending) {
    return <p className="font-semibold text-muted-foreground">Loading orders...</p>;
  }

  if (orders.isError) {
    return <p className="font-semibold text-error">{orders.error.message}</p>;
  }

  if (orders.data.length === 0) {
    return (
      <div className="rounded-lg bg-muted p-8 text-center">
        <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground" strokeWidth={2.5} />
        <p className="font-semibold">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.data.map((order) => (
        <article key={order.id} className="rounded-lg bg-muted p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Order</p>
              <h3 className="text-lg font-extrabold tracking-tight">{order.id.slice(0, 8)}…</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.items.length} items · ${order.total.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold tracking-wider uppercase ${statusColors[order.status]}`}
              >
                {order.status.replace('_', ' ')}
              </span>
              <Link
                to="/order/$orderId"
                params={{ orderId: order.id }}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-primary-hover"
              >
                View
              </Link>
            </div>
          </div>
          <ul className="mt-4 grid gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 rounded-md bg-background p-3 text-sm">
                <span>
                  <strong>{item.productName}</strong>
                  <span className="ml-2 text-muted-foreground">{item.productSku}</span>
                </span>
                <span className="font-semibold">
                  {item.quantity} × ${item.unitPrice.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
