"use client";

import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useToastContext } from "@/lib/providers/ToastProvider";
import { handleApiError } from "@/lib/utils/errorHandler";

/**
 * Hook to handle API errors with automatic toast notifications
 */
export const useApiError = () => {
  const toast = useToastContext();

  const handleError = (error: unknown) => {
    const message = handleApiError(error);
    toast.error(message);
  };

  return { handleError };
};

/**
 * Wrapper for useQuery with automatic error handling
 */
export const useApiQuery = <TData, TError = AxiosError>(
  options: UseQueryOptions<TData, TError> & {
    showErrorToast?: boolean;
  }
) => {
  const toast = useToastContext();
  const { showErrorToast = true, ...queryOptions } = options;

  const query = useQuery<TData, TError>(queryOptions);

  // Handle errors manually since onError is not available in v5
  if (query.isError && showErrorToast) {
    const message = handleApiError(query.error);
    toast.error(message);
  }

  return query;
};

/**
 * Wrapper for useMutation with automatic error handling
 */
export const useApiMutation = <TData, TVariables, TError = AxiosError>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    showErrorToast?: boolean;
    showSuccessToast?: boolean;
    successMessage?: string;
  }
) => {
  const toast = useToastContext();
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    onError: (error, variables, context, mutation) => {
      if (showErrorToast) {
        const message = handleApiError(error);
        toast.error(message);
      }
      mutationOptions.onError?.(error, variables, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      mutationOptions.onSuccess?.(data, variables, context, mutation);
    },
  });
};
