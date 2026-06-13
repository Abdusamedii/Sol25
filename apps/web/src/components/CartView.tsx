import { Link, useNavigate } from '@tanstack/react-router';
import { CreditCard, Minus, Plus, ShoppingBag, Trash2, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PaymentDeclinedError } from '../api/client';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { useCart } from '../hooks/useCart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePayOrder } from '../hooks/usePayOrder';
import {
  clearCart,
  getCartTotal,
  removeFromCart,
  updateCartItemQuantity,
} from '../lib/cart';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function CartView() {
  const cart = useCart();
  const currentUser = useCurrentUser();
  const createOrder = useCreateOrder();
  const payOrder = usePayOrder();
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const total = useMemo(() => getCartTotal(cart), [cart]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isCheckingOut = createOrder.isPending || payOrder.isPending;

  async function handleCheckout() {
    if (!currentUser || cart.length === 0 || !cardNumber.trim()) {
      return;
    }

    setCheckoutError(null);
    setPaymentFailed(false);

    try {
      const order = await createOrder.mutateAsync({
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      try {
        await payOrder.mutateAsync({ orderId: order.id, cardNumber });
      } catch (error) {
        if (error instanceof PaymentDeclinedError) {
          setPaymentFailed(true);
          setCheckoutError(
            error.details.payment.failureReason ?? 'Payment declined. Your items are still in the cart.',
          );
          return;
        }

        throw error;
      }

      clearCart();
      await navigate({ to: '/order/$orderId', params: { orderId: order.id } });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed');
    }
  }

  if (cart.length === 0) {
    return (
      <div className="grid gap-6">
        <div className="rounded-lg bg-secondary p-8 sm:p-12">
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-white text-secondary">
              <ShoppingBag className="h-8 w-8" strokeWidth={2.5} />
            </span>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white">Your cart is empty</h2>
            <p className="mb-8 text-white/80">Browse products and add items to get started.</p>
            <Button to="/" variant="secondary" className="mx-auto">
              Browse products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {paymentFailed ? (
        <div className="col-span-full rounded-lg bg-accent p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-accent">
              <AlertCircle className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Payment failed</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Your payment was declined</h2>
              <p className="mt-2 text-white/90">
                {checkoutError ?? 'Payment declined. Your items are still in the cart — try a different test card.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="rounded-lg bg-background p-6 sm:p-8">
          <p className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Items</p>
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
          </h2>

          <ul className="m-0 grid list-none gap-4 p-0">
            {cart.map((item) => (
              <li
                key={item.productId}
                className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <strong className="block text-lg font-bold">{item.name}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.sku} · ${item.price.toFixed(2)} each
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-background text-foreground transition-all duration-200 hover:scale-110 hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      onClick={() => updateCartItemQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <input
                      className="h-10 w-16 rounded-md border-0 bg-background text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max={item.stockQuantity}
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateCartItemQuantity(item.productId, Number(event.target.value))}
                    />
                    <button
                      type="button"
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-background text-foreground transition-all duration-200 hover:scale-110 hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      onClick={() =>
                        updateCartItemQuantity(item.productId, Math.min(item.stockQuantity, item.quantity + 1))
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-background text-error transition-all duration-200 hover:scale-110 hover:bg-error hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="h-fit rounded-lg bg-primary p-6 sm:p-8 lg:sticky lg:top-28">
        <p className="mb-1 text-xs font-semibold tracking-wider text-white/70 uppercase">Summary</p>
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-white">Order total</h2>

        <div className="mb-6 grid gap-3">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-4 text-white/90">
              <span className="truncate text-sm">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-end justify-between gap-4 border-t-2 border-white/20 pt-6">
          <span className="text-sm font-semibold tracking-wider text-white/70 uppercase">Total</span>
          <span className="text-4xl font-extrabold tracking-tight text-white">${total.toFixed(2)}</span>
        </div>

        {!currentUser ? (
          <Link
            to="/signin"
            className="inline-flex h-14 w-full items-center justify-center rounded-md bg-white text-base font-semibold text-primary transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Sign in to checkout
          </Link>
        ) : (
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">Test card number</span>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="bg-white pl-12"
                  placeholder="1111 1111 1111 1111"
                  value={cardNumber}
                  onChange={(event) => {
                    setCardNumber(event.target.value);
                    setPaymentFailed(false);
                    setCheckoutError(null);
                  }}
                />
              </div>
            </label>
            <p className="text-xs text-white/70">
              Use 1111 1111 1111 1111 to pay successfully or 4444 4444 4444 4444 to simulate a decline.
            </p>
            <button
              type="button"
              disabled={isCheckingOut || !cardNumber.trim()}
              onClick={() => void handleCheckout()}
              className="inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-md bg-white text-base font-semibold text-primary transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isCheckingOut ? 'Processing payment...' : 'Pay & checkout'}
            </button>
          </div>
        )}

        {checkoutError && !paymentFailed ? (
          <p className="mt-4 rounded-md bg-white/10 p-3 text-sm text-white">{checkoutError}</p>
        ) : null}
      </aside>
    </div>
  );
}
