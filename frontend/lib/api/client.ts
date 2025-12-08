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
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Transform error to include user-friendly message
    const userMessage = handleApiError(error);
    const enhancedError = {
      ...error,
      userMessage, // Add user-friendly message to error object
    };

    return Promise.reject(enhancedError);
  }
);
