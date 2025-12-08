import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { queryClient } from '../providers/ReactQueryProvider';
import type { SignupPayload, LoginPayload, AuthResponse } from 'shared/src/types/auth';

/**
 * useAuthMutation handles both signup and login flows.
 * - Calls backend `/auth/signup` or `/auth/login`
 * - On success stores token and user in Zustand + localStorage
 * - Demonstrates cookie storage (commented out)
 */
export function useAuthMutation(mode: 'login' | 'signup') {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';

  return useMutation<AuthResponse, Error, LoginPayload | SignupPayload>({
    mutationFn: async (payload: LoginPayload | SignupPayload): Promise<AuthResponse> => {
      const res = await apiClient.post<AuthResponse>(endpoint, payload);
      return res.data;
    },
    onSuccess: (data: AuthResponse) => {
      // Persist token and user in client state
      setAuth(data.user, data.token);

      // Double-check token persistence in localStorage (redundant with store persist,
      // but ensures apiClient interceptor can read it immediately)
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (e) {
        console.warn('Unable to write token/user to localStorage', e);
      }

      // Ensure axios default Authorization header is set immediately so subsequent
      // requests in the same session include the token without waiting for interceptors.
      try {
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      } catch (e) {
        // ignore if apiClient not available
        console.warn('Unable to set default Authorization header', e);
      }

      // Invalidate queries that may contain unauthenticated data, and refetch
      // any user-specific queries now that we have auth information.
      try {
        queryClient.invalidateQueries();
      } catch (e) {
        console.warn('Unable to invalidate queries after auth', e);
      }

      // Optionally store token in an HttpOnly cookie (server side recommended)
      /*
      document.cookie = `token=${data.token}; Path=/; Secure; SameSite=Strict; Max-Age=...`;
      */

      // Redirect user after successful auth
      router.push('/');
    },
  });

}

export default useAuthMutation;
