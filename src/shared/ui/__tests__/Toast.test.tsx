// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/shared/ui/Toast";
import { TOAST_DURATION_MS } from "@/shared/utils/constants";

vi.useFakeTimers();

function ToastTestComponent() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Success Message", "success")}>
        Show Success
      </button>
      <button onClick={() => showToast("Error Message", "error")}>
        Show Error
      </button>
      <button onClick={() => showToast("Info Message", "info")}>
        Show Info
      </button>
      <button onClick={() => showToast("Default Type Message")}>
        Show Default
      </button>
    </div>
  );
}

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("Toast", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should show a success toast with correct message", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Message")).toBeDefined();
  });

  it("should show an error toast with correct message", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Error Message")).toBeDefined();
  });

  it("should show an info toast with correct message", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Info"));
    expect(screen.getByText("Info Message")).toBeDefined();
  });

  it("should use default type 'info' when no type provided", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Default"));
    expect(screen.getByText("Default Type Message")).toBeDefined();
  });

  it("should show multiple toasts simultaneously", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Success Message")).toBeDefined();
    expect(screen.getByText("Error Message")).toBeDefined();
  });

  it("should have role='alert' on toast elements", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Success"));
    const alertElements = screen.getAllByRole("alert");
    expect(alertElements.length).toBe(1);
  });

  it("should close toast when clicking the close button", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Success"));

    const closeBtn = screen.getByLabelText("关闭通知");
    expect(closeBtn).toBeDefined();

    fireEvent.click(closeBtn);
    // After clicking close, the toast should have closing animation
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Success Message")).toBeNull();
  });

  it("should close toast when clicking the toast body", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Success"));

    const toastBody = screen.getByText("Success Message").closest("[role='alert']");
    expect(toastBody).toBeDefined();
    if (toastBody) {
      fireEvent.click(toastBody);
    }

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Success Message")).toBeNull();
  });

  it("should auto-remove toast after TOAST_DURATION_MS", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Info"));

    expect(screen.getByText("Info Message")).toBeDefined();

    // Advance time before auto-removal
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS - 100);
    });
    expect(screen.getByText("Info Message")).toBeDefined();

    // Advance past removal
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Info Message")).toBeNull();
  });

  it("should apply success type styles", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Success"));
    const alertEl = screen.getByRole("alert");
    expect(alertEl.className).toContain("from-green-500");
  });

  it("should apply error type styles", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Error"));
    const alertEl = screen.getByRole("alert");
    expect(alertEl.className).toContain("from-red-500");
  });

  it("should apply info type styles", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Info"));
    const alertEl = screen.getByRole("alert");
    expect(alertEl.className).toContain("from-blue-500");
  });

  it("should close when clicking toast and close button stopPropagation works", () => {
    renderWithToast(<ToastTestComponent />);
    fireEvent.click(screen.getByText("Show Info"));

    // Click close button to trigger remove
    const closeBtn = screen.getByLabelText("关闭通知");
    fireEvent.click(closeBtn);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Info Message")).toBeNull();
  });
});
