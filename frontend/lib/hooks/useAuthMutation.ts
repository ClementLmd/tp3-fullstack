import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { queryClient } from "../providers/ReactQueryProvider";
import type {
  SignupPayload,
  LoginPayload,
  AuthResponse,
} from "shared/src/types/auth";

interface AuthMutationResult {
  mutate: (payload: LoginPayload | SignupPayload) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * useAuthMutation handles both signup and login flows.
 * - Calls backend `/auth/signup` or `/auth/login`
 * - On success stores token and user in Zustand + localStorage
 * - Demonstrates cookie storage (commented out)
 */
export function useAuthMutation(mode: "login" | "signup"): AuthMutationResult {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";

  const mutation = useMutation<
    AuthResponse,
    Error,
    LoginPayload | SignupPayload
  >({
    mutationFn: async (
      payload: LoginPayload | SignupPayload
    ): Promise<AuthResponse> => {
      const res = await apiClient.post<AuthResponse>(endpoint, payload);
      return res.data;
    },
    onSuccess: (data: AuthResponse) => {
      // Token is stored in httpOnly cookie by the backend (not in response body)
      // Only store user data in client state
      // Zustand persist middleware will automatically save to localStorage
      setAuth(data.user, ""); // Token not needed in client state, it's in cookie

      // Invalidate queries that may contain unauthenticated data, and refetch
      // any user-specific queries now that we have auth information.
      try {
        queryClient.invalidateQueries();
      } catch (e) {
        console.warn("Unable to invalidate queries after auth", e);
      }

      // Redirect user after successful auth
      // Use router.push instead of window.location to avoid double navigation
      // The state is already updated via setAuth, so we just need to navigate
      router.push("/");
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export default useAuthMutation;
