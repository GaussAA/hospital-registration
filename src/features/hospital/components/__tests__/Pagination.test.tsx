// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "../Pagination";

const mockPush = vi.fn();
const mockSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, refresh: vi.fn() })),
  usePathname: vi.fn(() => "/hospitals"),
  useSearchParams: () => mockSearchParams(),
}));

describe("Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams("page=1"));
  });

  it("should render page numbers", () => {
    render(<Pagination page={1} totalPages={5} pageSize={10} total={50} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("should highlight current page", () => {
    render(<Pagination page={3} totalPages={5} pageSize={10} total={50} />);
    const page3 = screen.getByText("3");
    expect(page3.className).toContain("bg-blue-600");
    expect(page3.className).toContain("text-white");
  });

  it("should not highlight non-current page", () => {
    render(<Pagination page={3} totalPages={5} pageSize={10} total={50} />);
    const page1 = screen.getByText("1");
    expect(page1.className).not.toContain("bg-blue-600");
  });

  it("should disable previous button on first page", () => {
    render(<Pagination page={1} totalPages={5} pageSize={10} total={50} />);
    const prevButton = screen.getByText("← 上一页");
    expect(prevButton.closest("button")!.disabled).toBe(true);
  });

  it("should enable previous button when not on first page", () => {
    render(<Pagination page={2} totalPages={5} pageSize={10} total={50} />);
    const prevButton = screen.getByText("← 上一页");
    expect(prevButton.closest("button")!.disabled).toBe(false);
  });

  it("should disable next button on last page", () => {
    render(<Pagination page={5} totalPages={5} pageSize={10} total={50} />);
    const nextButton = screen.getByText("下一页 →");
    expect(nextButton.closest("button")!.disabled).toBe(true);
  });

  it("should enable next button when not on last page", () => {
    render(<Pagination page={1} totalPages={5} pageSize={10} total={50} />);
    const nextButton = screen.getByText("下一页 →");
    expect(nextButton.closest("button")!.disabled).toBe(false);
  });

  it("should call router.push with page-1 when clicking previous", () => {
    render(<Pagination page={3} totalPages={5} pageSize={10} total={50} />);
    const prevButton = screen.getByText("← 上一页");
    fireEvent.click(prevButton);
    expect(mockPush).toHaveBeenCalledWith("?page=2", { scroll: false });
  });

  it("should call router.push with page+1 when clicking next", () => {
    render(<Pagination page={3} totalPages={5} pageSize={10} total={50} />);
    const nextButton = screen.getByText("下一页 →");
    fireEvent.click(nextButton);
    expect(mockPush).toHaveBeenCalledWith("?page=4", { scroll: false });
  });

  it("should call router.push with specific page when clicking page number", () => {
    render(<Pagination page={1} totalPages={5} pageSize={10} total={50} />);
    const page3 = screen.getByText("3");
    fireEvent.click(page3);
    expect(mockPush).toHaveBeenCalledWith("?page=3", { scroll: false });
  });

  it("should not render page numbers beyond totalPages", () => {
    render(<Pagination page={1} totalPages={3} pageSize={10} total={30} />);
    expect(screen.queryByText("4")).toBeNull();
  });
});
