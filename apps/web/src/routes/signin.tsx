import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useSignin } from '../hooks/useSignin';
import { getCurrentUser, isAdmin } from '../lib/auth';

export const Route = createFileRoute('/signin')({
  beforeLoad: () => {
    const user = getCurrentUser();

    if (user && isAdmin(user)) {
      throw redirect({ to: '/admin' });
    }
  },
  component: SigninPage,
});

function SigninPage() {
  const navigate = useNavigate();
  const signin = useSignin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = await signin.mutateAsync({ username, password });
    await navigate({ to: session.user.role === 'admin' ? '/admin' : '/' });
  }

  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <section className="rounded-lg bg-primary p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-primary">
            <LogIn className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Account</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Sign in</h1>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-background p-6 sm:p-8">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <Field label="Username">
            <Input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {signin.isError ? (
            <p className="rounded-md bg-red-50 p-4 font-semibold text-error">{signin.error.message}</p>
          ) : null}

          <Button type="submit" disabled={!username || !password || signin.isPending} className="w-full">
            {signin.isPending ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Seeded accounts: admin / admin and customer / customer
          </p>
        </form>
      </section>
    </div>
  );
}
