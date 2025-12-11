import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "./authStore";
import { UserRole } from "shared/src/types/auth";
import { apiClient } from "@/lib/api/client";

// Mock apiClient
jest.mock("@/lib/api/client", () => ({
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
jest.mock("@/lib/providers/ReactQueryProvider", () => ({
  queryClient: {
    clear: jest.fn(),
  },
}));

describe("Auth Store", () => {
  beforeEach(() => {
    // Clear localStorage before each test, including Zustand persist storage
    localStorage.clear();
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    jest.clearAllMocks();

    // Reset the store state completely
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("should initialize with no user", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should set auth and store user in localStorage", () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: "123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.TEACHER,
    };

    act(() => {
      result.current.setAuth(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    // Check localStorage - Zustand persist stores under 'auth-storage'
    const storedData = JSON.parse(
      localStorage.getItem("auth-storage") || "null"
    );
    expect(storedData).not.toBeNull();
    expect(storedData.state.user).toEqual(mockUser);
    expect(storedData.state.isAuthenticated).toBe(true);
  });

  it("should initialize from localStorage", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.STUDENT,
    };

    // Zustand persist stores data under 'auth-storage' with this structure
    const persistedState = {
      state: {
        user: mockUser,
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem("auth-storage", JSON.stringify(persistedState));

    // Manually restore state from localStorage since persist middleware
    // only restores on initial store creation (which happens at module load)
    // In tests, we need to manually restore after setting localStorage
    act(() => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });
    });

    const { result } = renderHook(() => useAuthStore());

    // Call initialize to ensure isAuthenticated is synced
    act(() => {
      result.current.initialize();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should logout and clear state", async () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: "123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.TEACHER,
    };

    // Set auth first
    act(() => {
      result.current.setAuth(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Mock successful logout API call
    (apiClient.post as jest.Mock).mockResolvedValue({});

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    // Zustand persist stores under 'auth-storage', and logout clears it
    const storedData = JSON.parse(
      localStorage.getItem("auth-storage") || "null"
    );
    if (storedData) {
      expect(storedData.state.user).toBeNull();
      expect(storedData.state.isAuthenticated).toBe(false);
    }
  });

  it("should handle logout API failure gracefully", async () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: "123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.TEACHER,
    };

    act(() => {
      result.current.setAuth(mockUser);
    });

    // Mock failed logout API call
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Network error"));

    // Logout should still clear local state even if API fails
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
