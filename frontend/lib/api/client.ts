import axios, { AxiosError } from "axios";
import { handleApiError } from "@/lib/utils/errorHandler";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// BaseURL points to the backend root. Endpoints like `/auth/login` will be used.
export const apiClient = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Send cookies (httpOnly) with every request
});

// Request interceptor - no longer needed for Authorization header
// Token is now sent automatically via httpOnly cookie
// Keeping interceptor structure for potential future use
apiClient.interceptors.request.use(
  (config) => {
    // Token is now in httpOnly cookie, sent automatically with withCredentials: true
    // No need to manually add Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    // Cookie is cleared server-side, no need to clear localStorage
    if (error.response?.status === 401) {
      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Transform error to include user-friendly message
    const userMessage = handleApiError(error);
    // Use Object.assign to preserve non-enumerable properties (response, config, status, etc.)
    const enhancedError = Object.assign(error, {
      userMessage, // Add user-friendly message to error object
    });

    return Promise.reject(enhancedError);
  }
);
