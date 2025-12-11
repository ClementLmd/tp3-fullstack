import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';
import { UserRole } from 'shared/src/types/auth';
import { apiClient } from '@/lib/api/client';

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

// Mock queryClient
jest.mock('@/lib/providers/ReactQueryProvider', () => ({
  queryClient: {
    clear: jest.fn(),
  },
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set auth and store user in localStorage', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    };

    act(() => {
      result.current.setAuth(mockUser, 'token');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBeNull(); // Token is in cookie, not state

    // Check localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    expect(storedUser).toEqual(mockUser);
  });

  it('should initialize from localStorage', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
    };

    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.initialize();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should logout and clear state', async () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    };

    // Set auth first
    act(() => {
      result.current.setAuth(mockUser, 'token');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Mock successful logout API call
    (apiClient.post as jest.Mock).mockResolvedValue({});

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should handle logout API failure gracefully', async () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    };

    act(() => {
      result.current.setAuth(mockUser, 'token');
    });

    // Mock failed logout API call
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Logout should still clear local state even if API fails
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

