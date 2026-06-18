// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import AdminToastWrapper from "@/shared/ui/AdminToastWrapper";
import { TOAST_DURATION_MS } from "@/shared/utils/constants";

// Keep real timers but spy on setTimeout
vi.useFakeTimers();

describe("AdminToastWrapper", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should render children inside the wrapper", () => {
    render(
      <AdminToastWrapper>
        <div data-testid="child">Child Content</div>
      </AdminToastWrapper>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Child Content")).toBeDefined();
  });

  it("should render multiple children", () => {
    render(
      <AdminToastWrapper>
        <span data-testid="child1">First</span>
        <span data-testid="child2">Second</span>
      </AdminToastWrapper>,
    );
    expect(screen.getByTestId("child1")).toBeDefined();
    expect(screen.getByTestId("child2")).toBeDefined();
  });

  it("should render plain text children", () => {
    render(<AdminToastWrapper>Plain Text Content</AdminToastWrapper>);
    expect(screen.getByText("Plain Text Content")).toBeDefined();
  });

  it("should render with React node children", () => {
    render(
      <AdminToastWrapper>
        <p>Paragraph child</p>
      </AdminToastWrapper>,
    );
    expect(screen.getByText("Paragraph child")).toBeDefined();
  });
});
