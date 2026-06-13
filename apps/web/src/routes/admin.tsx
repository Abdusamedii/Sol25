import { createFileRoute, redirect } from '@tanstack/react-router';
import { LayoutDashboard, Package, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { AdminOrdersPanel } from '../components/admin/AdminOrdersPanel';
import { AdminProductsPanel } from '../components/admin/AdminProductsPanel';
import { getAuthToken, getCurrentUser, isAdmin } from '../lib/auth';

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    const user = getCurrentUser();
    const token = getAuthToken();

    if (!user || !token) {
      throw redirect({ to: '/signin' });
    }

    if (!isAdmin(user)) {
      throw redirect({ to: '/' });
    }
  },
  component: AdminDashboardPage,
});

type AdminTab = 'products' | 'orders';

function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTab>('products');
  const user = getCurrentUser();

  return (
    <div className="grid gap-6">
      <section className="rounded-lg bg-foreground p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-foreground">
              <LayoutDashboard className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">Admin</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
              <p className="mt-1 text-white/70">Signed in as {user?.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('products')}
              className={`inline-flex h-12 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                tab === 'products' ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Package className="h-4 w-4" strokeWidth={2.5} />
              Products
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`inline-flex h-12 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                tab === 'orders' ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
              Orders
            </button>
          </div>
        </div>
      </section>

      {tab === 'products' ? <AdminProductsPanel /> : <AdminOrdersPanel />}
    </div>
  );
}
