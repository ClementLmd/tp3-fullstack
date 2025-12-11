import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// BaseURL points to the backend root. Endpoints like `/auth/login` will be used.
export const apiClient = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
    // Handle connection refused errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to API server at', API_URL);
      const err = new Error(
        'Cannot connect to the server. Please ensure the backend is running on ' + API_URL
      );
      return Promise.reject(err);
    }

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle other errors
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as { error?: string };
      if (data.error) {
        return Promise.reject(new Error(data.error));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;