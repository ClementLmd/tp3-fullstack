import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AuthGuard from "./AuthGuard";
import { useAuthStore } from "@/lib/store/authStore";
import { UserRole } from "shared/src/types/auth";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock auth store
jest.mock("@/lib/store/authStore", () => ({
  useAuthStore: jest.fn(),
}));

describe("AuthGuard", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it("should render children when user is authenticated", () => {
    const mockInitialize = jest.fn();
    const mockLogout = jest.fn();

    // Mock useAuthStore to return a function that accepts a selector
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        user: {
          id: "123",
          email: "test@example.com",
          role: UserRole.TEACHER,
        },
        token: "mock-token", // Token must be truthy for component to render
        initialize: mockInitialize,
        logout: mockLogout,
      };
      return selector ? selector(mockState) : mockState;
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should redirect to login when user is not authenticated", () => {
    const mockInitialize = jest.fn();
    const mockLogout = jest.fn();

    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        user: null,
        token: null,
        initialize: mockInitialize,
        logout: mockLogout,
      };
      return selector ? selector(mockState) : mockState;
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("should redirect when user does not have required role", async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    const mockInitialize = jest.fn();

    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        user: {
          id: "123",
          email: "test@example.com",
          role: UserRole.STUDENT, // Student trying to access teacher route
        },
        token: "mock-token", // Token must be truthy to pass first check
        initialize: mockInitialize,
        logout: mockLogout,
      };
      return selector ? selector(mockState) : mockState;
    });

    render(
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div>Teacher Only Content</div>
      </AuthGuard>
    );

    // Wait for async logout
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("should allow access when user has required role", () => {
    const mockInitialize = jest.fn();
    const mockLogout = jest.fn();

    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        user: {
          id: "123",
          email: "test@example.com",
          role: UserRole.TEACHER,
        },
        token: "mock-token", // Token must be truthy for component to render
        initialize: mockInitialize,
        logout: mockLogout,
      };
      return selector ? selector(mockState) : mockState;
    });

    render(
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div>Teacher Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Teacher Content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
