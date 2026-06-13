import { useMutation } from '@tanstack/react-query';
import { signin } from '../api/client';
import { setCurrentUser } from '../lib/auth';

export function useSignin() {
  return useMutation({
    mutationFn: signin,
    onSuccess: (user) => {
      setCurrentUser(user);
    },
  });
}
