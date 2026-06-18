// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ChatMessage from "../ChatMessage";

vi.mock("@/shared/ui/ThemeProvider", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock("remark-gfm", () => ({
  default: () => () => {},
}));

describe("ChatMessage", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render user message", () => {
    render(<ChatMessage role="user" content="你好" />);
    expect(screen.getByText("你好")).toBeDefined();
    expect(screen.getByText("你")).toBeDefined(); // User avatar label
  });

  it("should render assistant message with markdown", () => {
    render(<ChatMessage role="assistant" content="**帮助信息**" />);
    expect(screen.getByTestId("markdown")).toBeDefined();
    expect(screen.getByText("AI")).toBeDefined(); // AI avatar label
  });

  it("should show typing indicator when isTyping", () => {
    render(<ChatMessage role="assistant" content="" isTyping={true} />);
    // Should show animated dots
    const dots = document.querySelector(".animate-pulse");
    expect(dots).toBeDefined();
  });

  it("should show loading state when isLoading", () => {
    render(<ChatMessage role="assistant" content="" isLoading={true} />);
    // Should render loading skeleton
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeDefined();
  });

  it("should show thinking indicator when isThinking", () => {
    render(<ChatMessage role="assistant" content="" isThinking={true} thinkingContent="思考中..." />);
    expect(screen.getByText("思考中...")).toBeDefined();
  });

  it("should show executing tool indicator", () => {
    render(
      <ChatMessage
        role="assistant"
        content=""
        isExecutingTool={true}
        executingToolName="search_hospitals"
      />
    );
    expect(screen.getByText(/搜索医院/)).toBeDefined();
  });

  it("should show collapsed tool call names with expand", () => {
    render(
      <ChatMessage
        role="assistant"
        content="结果"
        toolCallNames={["search_hospitals"]}
      />
    );
    expect(screen.getByText(/搜索医院/)).toBeDefined();
  });

  it("should show tool call results", () => {
    render(
      <ChatMessage
        role="assistant"
        content="已为您找到以下医院"
        toolCallResults={[{ name: "search_hospitals", result: "找到3家医院" }]}
      />
    );
    expect(screen.getByText(/搜索医院/)).toBeDefined();
  });
});
