import type { Order } from '@sol25/shared';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/order/$orderId')({
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { orderId } = Route.useParams();
  const storedOrder = sessionStorage.getItem(`order:${orderId}`);
  const order = storedOrder ? (JSON.parse(storedOrder) as Order) : null;

  if (!order) {
    return (
      <section className="panel">
        <p className="eyebrow">Order confirmation</p>
        <h2>Order not found in this browser session</h2>
        <Link to="/order" className="button">
          Create another order
        </Link>
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="eyebrow">Order confirmation</p>
      <h2>Order placed</h2>
      <p className="confirmation-total">Total: ${order.total.toFixed(2)}</p>

      <div className="line-items">
        {order.items.map((item) => (
          <div key={item.id} className="line-item">
            <span>
              <strong>{item.productName}</strong>
              <small>{item.productSku}</small>
            </span>
            <span>
              {item.quantity} × ${item.unitPrice.toFixed(2)}
            </span>
            <strong>${item.lineTotal.toFixed(2)}</strong>
          </div>
        ))}
      </div>

      <Link to="/" className="button">
        Back to products
      </Link>
    </section>
  );
}
