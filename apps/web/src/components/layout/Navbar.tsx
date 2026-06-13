import { Link, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, Package, ShoppingCart, LogIn, LogOut } from 'lucide-react';
import { memo } from 'react';
import { useCart } from '../../hooks/useCart';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { setAuthSession } from '../../lib/auth';

const navLinkBase =
  'inline-flex h-12 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const navLinkInactive = `${navLinkBase} text-foreground hover:bg-muted hover:scale-105`;
const navLinkActive = `${navLinkBase} bg-primary text-white`;

export const Navbar = memo(function Navbar() {
  const currentUser = useCurrentUser();
  const cart = useCart();
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function handleSignOut() {
    setAuthSession(null, null);
    await navigate({ to: '/signin' });
  }

  const homeTo = currentUser?.role === 'admin' ? '/admin' : '/';

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={homeTo} className="group flex items-center gap-3 transition-transform duration-200 hover:scale-105">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
            <Package className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Sol25</p>
            <p className="text-lg leading-tight font-extrabold tracking-tight">Inventory</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {currentUser?.role !== 'admin' ? (
            <>
              <Link
                to="/"
                activeProps={{ className: navLinkActive }}
                inactiveProps={{ className: navLinkInactive }}
              >
                <Package className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Products</span>
              </Link>

              <Link
                to="/cart"
                activeProps={{ className: navLinkActive }}
                inactiveProps={{ className: navLinkInactive }}
              >
                <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-accent px-1.5 text-xs font-bold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            </>
          ) : null}

          {currentUser?.role === 'admin' ? (
            <Link
              to="/admin"
              activeProps={{ className: navLinkActive }}
              inactiveProps={{ className: navLinkInactive }}
            >
              <LayoutDashboard className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          ) : null}

          {currentUser ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className={`${navLinkInactive} cursor-pointer border-0 bg-transparent`}
            >
              <LogOut className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden md:inline">{currentUser.username}</span>
            </button>
          ) : (
            <Link
              to="/signin"
              activeProps={{ className: navLinkActive }}
              inactiveProps={{ className: navLinkInactive }}
            >
              <LogIn className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
});
