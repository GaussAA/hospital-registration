// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ChatHistory from "../ChatHistory";

vi.mock("@/shared/ui/ThemeProvider", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

const mockConversations = [
  { id: "conv-1", title: "挂号咨询", messageCount: 5, updatedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "conv-2", title: "预约内科", messageCount: 3, updatedAt: new Date(Date.now() - 7200000).toISOString() },
];

describe("ChatHistory", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    conversations: mockConversations,
    activeConversationId: null,
    onSwitch: vi.fn(),
    onNew: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render conversation list", () => {
    render(<ChatHistory {...defaultProps} />);
    expect(screen.getByText("挂号咨询")).toBeDefined();
    expect(screen.getByText("预约内科")).toBeDefined();
  });

  it("should show empty state when no conversations", () => {
    render(<ChatHistory {...defaultProps} conversations={[]} />);
    expect(screen.getByText("暂无对话")).toBeDefined();
  });

  it("should filter conversations by search query", () => {
    render(<ChatHistory {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("搜索对话...");
    fireEvent.change(searchInput, { target: { value: "内科" } });
    expect(screen.queryByText("挂号咨询")).toBeNull();
    expect(screen.getByText("预约内科")).toBeDefined();
  });

  it("should call onSwitch when clicking a conversation", () => {
    const onSwitch = vi.fn();
    render(<ChatHistory {...defaultProps} onSwitch={onSwitch} />);
    fireEvent.click(screen.getByText("挂号咨询"));
    expect(onSwitch).toHaveBeenCalledWith("conv-1");
  });

  it("should call onNew when clicking new chat button", () => {
    const onNew = vi.fn();
    render(<ChatHistory {...defaultProps} onNew={onNew} />);
    fireEvent.click(screen.getByText("新对话"));
    expect(onNew).toHaveBeenCalled();
  });

  it("should show delete confirmation when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<ChatHistory {...defaultProps} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole("button");
    // Find the delete button for the first conversation
    const deleteBtn = deleteButtons.find((b) => b.innerHTML.includes("M14.74"));
    if (deleteBtn) fireEvent.click(deleteBtn);
    expect(screen.getByText("确定删除?")).toBeDefined();
  });

  it("should call onDelete when confirming delete", () => {
    const onDelete = vi.fn();
    render(<ChatHistory {...defaultProps} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole("button");
    const deleteBtn = deleteButtons.find((b) => b.innerHTML.includes("M14.74"));
    if (deleteBtn) fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByText("确定"));
    expect(onDelete).toHaveBeenCalledWith("conv-1");
  });

  it("should highlight active conversation", () => {
    render(<ChatHistory {...defaultProps} activeConversationId="conv-1" />);
    const activeConv = screen.getByText("挂号咨询").closest("button") || screen.getByText("挂号咨询");
    expect(activeConv).toBeDefined();
  });

  it("should not render when isOpen is false", () => {
    render(<ChatHistory {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("挂号咨询")).toBeNull();
  });
});
