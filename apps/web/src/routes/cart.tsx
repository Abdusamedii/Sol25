import { createFileRoute, redirect } from '@tanstack/react-router';
import { CartView } from '../components/CartView';
import { getCurrentUser, isAdmin } from '../lib/auth';

export const Route = createFileRoute('/cart')({
  beforeLoad: () => {
    if (isAdmin(getCurrentUser())) {
      throw redirect({ to: '/admin' });
    }
  },
  component: CartPage,
});

function CartPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg bg-accent p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Your order</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Shopping cart</h1>
      </section>
      <CartView />
    </div>
  );
}
