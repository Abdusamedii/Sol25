import { useMutation } from '@tanstack/react-query';
import { signin } from '../api/client';
import { setAuthSession } from '../lib/auth';

export function useSignin() {
  return useMutation({
    mutationFn: signin,
    onSuccess: ({ user, token }) => {
      setAuthSession(user, token);
    },
  });
}
