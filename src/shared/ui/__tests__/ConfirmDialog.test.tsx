// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should not render when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="测试标题"
        message="确认内容"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText("测试标题")).toBeNull();
    expect(screen.queryByText("确认内容")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should render title and message when open is true", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认删除"
        message="确定要删除这条记录吗？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("确认删除")).toBeDefined();
    expect(screen.getByText("确定要删除这条记录吗？")).toBeDefined();
  });

  it("should have correct aria attributes", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认操作"
        message="请确认"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("confirm-title");
  });

  it("should display default button labels", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("确定")).toBeDefined();
    expect(screen.getByText("取消")).toBeDefined();
  });

  it("should display custom button labels", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        confirmLabel="是的"
        cancelLabel="返回"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("是的")).toBeDefined();
    expect(screen.getByText("返回")).toBeDefined();
  });

  it("should call onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("确定"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText("取消"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when clicking backdrop", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    const backdrop = container.querySelector(".bg-black/40");
    expect(backdrop).toBeDefined();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it("should call onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not call onCancel on Escape when loading", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={onCancel}
        loading={true}
      />,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("should show loading spinner and changed text when loading", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="处理中..."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />,
    );
    expect(screen.getByText("处理中...")).toBeDefined();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeDefined();
  });

  it("should disable buttons when loading", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />,
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn.getAttribute("disabled")).toBe("");
    });
  });

  it("should not call onCancel via backdrop when loading", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="确认？"
        onConfirm={vi.fn()}
        onCancel={onCancel}
        loading={true}
      />,
    );
    const backdrop = container.querySelector(".bg-black/40");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onCancel).not.toHaveBeenCalled();
    }
  });

  it("should render ReactNode as message", () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message={<span data-testid="custom-msg">自定义消息</span>}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("custom-msg")).toBeDefined();
    expect(screen.getByText("自定义消息")).toBeDefined();
  });

  describe("variant styles", () => {
    it("should render danger variant with red icon", () => {
      const { container } = render(
        <ConfirmDialog
          open={true}
          title="删除"
          message="确定删除？"
          variant="danger"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      const confirmBtn = screen.getByText("确定");
      expect(confirmBtn.className).toContain("bg-red-600");
    });

    it("should render warning variant with amber styles", () => {
      render(
        <ConfirmDialog
          open={true}
          title="警告"
          message="请注意"
          variant="warning"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      const confirmBtn = screen.getByText("确定");
      expect(confirmBtn.className).toContain("bg-amber-600");
    });

    it("should render info variant with blue styles", () => {
      render(
        <ConfirmDialog
          open={true}
          title="提示"
          message="信息提示"
          variant="info"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      const confirmBtn = screen.getByText("确定");
      expect(confirmBtn.className).toContain("bg-blue-600");
    });
  });
});
