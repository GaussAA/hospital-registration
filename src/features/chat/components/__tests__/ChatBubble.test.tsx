// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ChatBubble from "../ChatBubble";

vi.mock("@/shared/ui/ThemeProvider", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

vi.mock("../ChatPanel", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="chat-panel"><button onClick={onClose}>关闭</button></div> : null,
}));

describe("ChatBubble", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render the floating trigger button", () => {
    render(<ChatBubble />);
    expect(screen.getByLabelText("打开AI挂号助手")).toBeDefined();
  });

  it("should show tooltip with label", () => {
    render(<ChatBubble />);
    expect(screen.getByText("AI 挂号助手")).toBeDefined();
  });

  it("should show notification dot when closed", () => {
    render(<ChatBubble />);
    const dot = document.querySelector(".animate-pulse");
    expect(dot).toBeDefined();
  });

  it("should open ChatPanel when button is clicked", () => {
    render(<ChatBubble />);
    const button = screen.getByLabelText("打开AI挂号助手");
    fireEvent.click(button);
    expect(screen.getByTestId("chat-panel")).toBeDefined();
  });

  it("should close ChatPanel when onClose is triggered", () => {
    render(<ChatBubble />);
    const button = screen.getByLabelText("打开AI挂号助手");
    fireEvent.click(button);
    expect(screen.getByTestId("chat-panel")).toBeDefined();
    fireEvent.click(screen.getByText("关闭"));
    expect(screen.queryByTestId("chat-panel")).toBeNull();
  });

  it("should hide the trigger button when panel is open", () => {
    render(<ChatBubble />);
    fireEvent.click(screen.getByLabelText("打开AI挂号助手"));
    const triggerContainer = screen.getByLabelText("打开AI挂号助手").closest("div[class]");
    expect(triggerContainer?.className).toContain("opacity-0");
  });
});
