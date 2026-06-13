import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Clock3, Package, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useOrder } from '../hooks/useOrder';

export const Route = createFileRoute('/order/$orderId')({
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { orderId } = Route.useParams();
  const order = useOrder(orderId);

  if (order.isPending) {
    return (
      <div className="rounded-lg bg-background p-12 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" strokeWidth={2.5} />
        <p className="font-semibold text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (order.isError || !order.data) {
    return (
      <div className="grid gap-6">
        <section className="rounded-lg bg-error p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-error">
              <XCircle className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Order confirmation</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Order not found</h1>
            </div>
          </div>
        </section>
        <section className="rounded-lg bg-background p-6 sm:p-8">
          <p className="mb-6 font-semibold text-error">
            {order.error?.message ?? 'This order could not be loaded.'}
          </p>
          <Button to="/">Back to products</Button>
        </section>
      </div>
    );
  }

  const isPaid = order.data.status === 'paid';
  const isPaymentFailed = order.data.status === 'payment_failed';
  const isPendingPayment = order.data.status === 'pending_payment';

  return (
    <div className="grid gap-6">
      {isPaid ? (
        <section className="rounded-lg bg-secondary p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-secondary">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Order confirmation</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Payment successful</h1>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                ${order.data.total.toFixed(2)}
              </p>
              {order.data.payment?.cardLast4 ? (
                <p className="mt-2 text-sm text-white/80">Paid with card ending in {order.data.payment.cardLast4}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isPaymentFailed ? (
        <section className="rounded-lg bg-accent p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-accent">
              <AlertCircle className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Payment failed</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Payment declined</h1>
              <p className="mt-2 text-white/80">
                {order.data.payment?.failureReason ?? 'Your test card was declined. Try again with a different card.'}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {isPendingPayment ? (
        <section className="rounded-lg bg-primary p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-primary">
              <Clock3 className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Awaiting payment</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Payment pending</h1>
              <p className="mt-2 text-white/80">This order has not been paid yet.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg bg-background p-6 sm:p-8">
        <p className="mb-6 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Shipping address</p>
        {order.data.shippingAddress.line1 ? (
          <p className="mb-6 font-semibold">
            {order.data.shippingAddress.line1}
            {order.data.shippingAddress.line2 ? `, ${order.data.shippingAddress.line2}` : ''}
            <br />
            {order.data.shippingAddress.postalCode} {order.data.shippingAddress.city}
            <br />
            {order.data.shippingAddress.country}
          </p>
        ) : (
          <p className="mb-6 font-semibold text-muted-foreground">No shipping address recorded.</p>
        )}

        <p className="mb-6 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Line items</p>
        <div className="grid gap-3">
          {order.data.items.map((item, index) => {
            const tints = ['bg-blue-50', 'bg-emerald-50', 'bg-amber-50'] as const;
            const tint = tints[index % tints.length];

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-lg ${tint} p-4 sm:flex-row sm:items-center sm:justify-between`}
              >
                <span>
                  <strong className="block text-lg font-bold">{item.productName}</strong>
                  <small className="text-sm text-muted-foreground">{item.productSku}</small>
                </span>
                <span className="font-medium text-muted-foreground">
                  {item.quantity} × ${item.unitPrice.toFixed(2)}
                </span>
                <strong className="text-xl font-extrabold text-primary">${item.lineTotal.toFixed(2)}</strong>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {isPaymentFailed || isPendingPayment ? (
            <Link
              to="/cart"
              className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-6 text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Back to cart
            </Link>
          ) : null}
          <Link
            to="/"
            className="inline-flex h-14 items-center justify-center rounded-md bg-muted px-6 text-base font-semibold text-foreground transition-all duration-200 hover:scale-105 hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Back to products
          </Link>
        </div>
      </section>
    </div>
  );
}
