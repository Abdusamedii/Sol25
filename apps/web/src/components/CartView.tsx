import { Link, useNavigate } from '@tanstack/react-router';
import { CreditCard, MapPin, Minus, Plus, ShoppingBag, Trash2, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PaymentDeclinedError } from '../api/client';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { useCart } from '../hooks/useCart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  clearCart,
  getCartTotal,
  removeFromCart,
  updateCartItemQuantity,
} from '../lib/cart';
import { Button } from './ui/Button';
import { Field, Input } from './ui/Input';

type CheckoutFormState = {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
  cardNumber: string;
};

const emptyCheckoutForm: CheckoutFormState = {
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: '',
  cardNumber: '',
};

export function CartView() {
  const cart = useCart();
  const currentUser = useCurrentUser();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>(emptyCheckoutForm);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const total = useMemo(() => getCartTotal(cart), [cart]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isCheckoutReady =
    checkoutForm.line1.trim() &&
    checkoutForm.city.trim() &&
    checkoutForm.postalCode.trim() &&
    checkoutForm.country.trim() &&
    checkoutForm.cardNumber.trim();

  async function handleCreateOrder() {
    if (!currentUser || cart.length === 0 || !isCheckoutReady) {
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
        shippingAddress: {
          line1: checkoutForm.line1.trim(),
          line2: checkoutForm.line2.trim() || undefined,
          city: checkoutForm.city.trim(),
          postalCode: checkoutForm.postalCode.trim(),
          country: checkoutForm.country.trim(),
        },
        cardNumber: checkoutForm.cardNumber,
      });

      clearCart();
      setCheckoutForm(emptyCheckoutForm);
      await navigate({ to: '/order/$orderId', params: { orderId: order.id } });
    } catch (error) {
      if (error instanceof PaymentDeclinedError) {
        setPaymentFailed(true);
        setCheckoutError(error.message);
        return;
      }

      setCheckoutError(error instanceof Error ? error.message : 'Order creation failed');
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

        {currentUser ? (
          <div className="rounded-lg bg-background p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-primary">
                <MapPin className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Checkout</p>
                <h2 className="text-2xl font-extrabold tracking-tight">Create order</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address line 1" className="sm:col-span-2">
                <Input
                  required
                  value={checkoutForm.line1}
                  onChange={(event) => setCheckoutForm({ ...checkoutForm, line1: event.target.value })}
                />
              </Field>
              <Field label="Address line 2" className="sm:col-span-2">
                <Input
                  value={checkoutForm.line2}
                  onChange={(event) => setCheckoutForm({ ...checkoutForm, line2: event.target.value })}
                />
              </Field>
              <Field label="City">
                <Input
                  required
                  value={checkoutForm.city}
                  onChange={(event) => setCheckoutForm({ ...checkoutForm, city: event.target.value })}
                />
              </Field>
              <Field label="Postal code">
                <Input
                  required
                  value={checkoutForm.postalCode}
                  onChange={(event) => setCheckoutForm({ ...checkoutForm, postalCode: event.target.value })}
                />
              </Field>
              <Field label="Country" className="sm:col-span-2">
                <Input
                  required
                  value={checkoutForm.country}
                  onChange={(event) => setCheckoutForm({ ...checkoutForm, country: event.target.value })}
                />
              </Field>
              <Field label="Test card number" className="sm:col-span-2">
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-12"
                    placeholder="1111 1111 1111 1111"
                    value={checkoutForm.cardNumber}
                    onChange={(event) => {
                      setCheckoutForm({ ...checkoutForm, cardNumber: event.target.value });
                      setPaymentFailed(false);
                      setCheckoutError(null);
                    }}
                  />
                </div>
              </Field>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Use 1111 1111 1111 1111 to pay successfully or 4444 4444 4444 4444 to simulate a decline.
            </p>

            <button
              type="button"
              disabled={createOrder.isPending || !isCheckoutReady}
              onClick={() => void handleCreateOrder()}
              className="mt-6 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-md bg-primary text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto sm:px-8"
            >
              {createOrder.isPending ? 'Creating order...' : 'Create order'}
            </button>

            {checkoutError && !paymentFailed ? (
              <p className="mt-4 rounded-md bg-muted p-3 text-sm font-semibold text-error">{checkoutError}</p>
            ) : null}
          </div>
        ) : null}
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

        <div className="flex items-end justify-between gap-4 border-t-2 border-white/20 pt-6">
          <span className="text-sm font-semibold tracking-wider text-white/70 uppercase">Total</span>
          <span className="text-4xl font-extrabold tracking-tight text-white">${total.toFixed(2)}</span>
        </div>

        {!currentUser ? (
          <Link
            to="/signin"
            className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-md bg-white text-base font-semibold text-primary transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Sign in to create order
          </Link>
        ) : (
          <p className="mt-6 text-sm text-white/70">
            Fill in your shipping address and payment details, then create your order.
          </p>
        )}
      </aside>
    </div>
  );
}
