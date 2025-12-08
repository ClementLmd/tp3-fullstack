"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { handleApiError } from "@/lib/utils/errorHandler";

// We'll import useToastContext dynamically to avoid circular dependencies
// For now, we'll create a simple toast function that can be set from ToastProvider

let toastErrorFn: ((message: string) => void) | null = null;

export const setToastErrorFn = (fn: (message: string) => void) => {
  toastErrorFn = fn;
};

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // Retry once on failure
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            // Log error for debugging
            console.error("Query error:", error);

            // Get user-friendly message
            const message = handleApiError(error);

            // Show toast if available
            if (toastErrorFn) {
              toastErrorFn(message);
            } else {
              console.warn("User-friendly error:", message);
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            // Log error for debugging
            console.error("Mutation error:", error);

            // Get user-friendly message
            const message = handleApiError(error);

            // Show toast if available
            if (toastErrorFn) {
              toastErrorFn(message);
            } else {
              console.warn("User-friendly error:", message);
            }
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
