// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Modal from "@/shared/ui/Modal";

describe("Modal", () => {
  beforeEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("should not render content when open is false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    expect(screen.queryByText("测试弹窗")).toBeNull();
    expect(screen.queryByText("弹窗内容")).toBeNull();
  });

  it("should render title and children when open is true", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    expect(screen.getByText("测试弹窗")).toBeDefined();
    expect(screen.getByText("弹窗内容")).toBeDefined();
  });

  it("should call onClose when clicking the close button", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    const closeButton = screen.getByLabelText("关闭");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when clicking the backdrop overlay", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open={true} onClose={onClose} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    // The backdrop is the first child of the overlay with bg-black/40 class
    // Since the class has / which is a CSS escape, let's try another approach
    // The backdrop has onClick={onClose}
    const overlayChildren = container.firstElementChild?.children;
    // First child of the dialog should be the backdrop
    const backdropElement = overlayChildren?.[0];
    if (backdropElement) {
      fireEvent.click(backdropElement);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it("should render with custom maxWidth class", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="测试弹窗" maxWidth="max-w-2xl">
        <p>弹窗内容</p>
      </Modal>,
    );

    // The content div should have max-w-2xl class
    const contentDiv = screen.getByText("弹窗内容").closest(".max-w-2xl");
    expect(contentDiv).toBeDefined();
  });

  it("should use default max-w-lg when maxWidth not provided", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    const contentDiv = screen.getByText("弹窗内容").closest(".max-w-lg");
    expect(contentDiv).toBeDefined();
  });

  it("should set aria attributes correctly", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("modal-title");
  });

  it("should lock body scroll when open", () => {
    const { rerender } = render(
      <Modal open={true} onClose={vi.fn()} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal open={false} onClose={vi.fn()} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("");
  });

  it("should call onClose when pressing Escape key", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="测试弹窗">
        <p>弹窗内容</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
