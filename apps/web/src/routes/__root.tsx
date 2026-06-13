import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Link, Outlet, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { setCurrentUser } from '../lib/auth';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootLayout,
});

function RootLayout() {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  async function handleSignOut() {
    setCurrentUser(null);
    await navigate({ to: '/' });
  }

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <p className="eyebrow">Solution25 Take-Home</p>
            <h1>Inventory Orders</h1>
          </div>
          <nav>
            <Link to="/" activeProps={{ className: 'active-link' }}>
              Products
            </Link>
            <Link to="/order" activeProps={{ className: 'active-link' }}>
              Create Order
            </Link>
            {currentUser ? (
              <button className="link-button" type="button" onClick={handleSignOut}>
                {currentUser.username} ({currentUser.role}) · Sign out
              </button>
            ) : (
              <Link to="/signin" activeProps={{ className: 'active-link' }}>
                Sign in
              </Link>
            )}
          </nav>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </>
  );
}
