import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSignin } from '../hooks/useSignin';

export const Route = createFileRoute('/signin')({
  component: SigninPage,
});

function SigninPage() {
  const navigate = useNavigate();
  const signin = useSignin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signin.mutateAsync({ username, password });
    await navigate({ to: '/' });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Sign in</h2>
        </div>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <label className="order-row">
          <span>
            <strong>Username</strong>
          </span>
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="order-row">
          <span>
            <strong>Password</strong>
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {signin.isError ? <p className="error">{signin.error.message}</p> : null}

        <button className="button" disabled={!username || !password || signin.isPending} type="submit">
          {signin.isPending ? 'Signing in...' : 'Sign in'}
        </button>

        <small>Seeded accounts: admin / admin and customer / customer</small>
      </form>
    </section>
  );
}
