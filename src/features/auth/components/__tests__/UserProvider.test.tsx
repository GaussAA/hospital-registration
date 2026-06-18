// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { UserProvider, useUser } from "../UserProvider";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

/** Helper component that renders context values for testing */
function TestConsumer() {
  const { user, loading, setUser, refreshUser } = useUser();

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!user) return <div data-testid="no-user">No user</div>;

  return (
    <div>
      <span data-testid="user-id">{user.id}</span>
      <span data-testid="user-name">{user.name}</span>
      <span data-testid="user-role">{user.role}</span>
      <button data-testid="refresh-btn" onClick={refreshUser}>Refresh</button>
      <button data-testid="set-null-btn" onClick={() => setUser(null)}>Set Null</button>
    </div>
  );
}

function setup() {
  return render(
    <UserProvider>
      <TestConsumer />
    </UserProvider>,
  );
}

describe("UserProvider", () => {
  it("shows loading state initially", () => {
    // Fetch never resolves during this test
    mockFetch.mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("sets user data when refreshUser succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { id: "1", name: "Admin", role: "admin" } }),
    });

    setup();

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("user-name")).toHaveTextContent("Admin");
    expect(screen.getByTestId("user-role")).toHaveTextContent("admin");
  });

  it("sets user to null when API returns non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    setup();

    await waitFor(() => {
      expect(screen.getByTestId("no-user")).toBeInTheDocument();
    });
  });

  it("sets user to null when API returns error code", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 401, message: "Unauthorized" }),
    });

    setup();

    await waitFor(() => {
      expect(screen.getByTestId("no-user")).toBeInTheDocument();
    });
  });

  it("sets user to null when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    setup();

    await waitFor(() => {
      expect(screen.getByTestId("no-user")).toBeInTheDocument();
    });
  });

  it("refreshUser can refetch and update user", async () => {
    // First render - no user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 401 }),
    });

    setup();

    await waitFor(() => {
      expect(screen.getByTestId("no-user")).toBeInTheDocument();
    });

    // Now simulate a refresh that succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { id: "2", name: "Refreshed", role: "user" } }),
    });

    await act(async () => {
      screen.getByTestId("refresh-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("2");
    });
  });

  it("setUser can clear user to null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { id: "1", name: "Admin", role: "admin" } }),
    });

    setup();

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId("set-null-btn").click();
    });

    expect(screen.getByTestId("no-user")).toBeInTheDocument();
  });

  it("renders children without crashing", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { container } = setup();
    expect(container).toBeInTheDocument();
  });
});
