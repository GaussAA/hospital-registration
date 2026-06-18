// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HospitalFilter from "../HospitalFilter";

const mockPush = vi.fn();
const mockSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, refresh: vi.fn() })),
  usePathname: vi.fn(() => "/hospitals"),
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@/shared/hooks/useDebounce", () => ({
  useDebounce: vi.fn((val: string) => val),
}));

describe("HospitalFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("should render city select with all options", () => {
    render(<HospitalFilter />);
    expect(screen.getByText("全部城市")).toBeDefined();
    expect(screen.getByText("北京")).toBeDefined();
    expect(screen.getByText("上海")).toBeDefined();
    expect(screen.getByText("广州")).toBeDefined();
  });

  it("should render level select with all options", () => {
    render(<HospitalFilter />);
    expect(screen.getByText("全部等级")).toBeDefined();
    expect(screen.getByText("三级甲等")).toBeDefined();
    expect(screen.getByText("三级乙等")).toBeDefined();
  });

  it("should render search input", () => {
    render(<HospitalFilter />);
    const input = screen.getByPlaceholderText("搜索医院名称...");
    expect(input).toBeDefined();
  });

  it("should render clear button with active count when city param is set", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("city=北京"));
    render(<HospitalFilter />);
    const clearButton = screen.getByText("清除");
    expect(clearButton).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("should render clear button with active count 2 when city and level are set", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("city=北京&level=三级甲等"));
    render(<HospitalFilter />);
    expect(screen.getByText("2")).toBeDefined();
  });

  it("should not show active count badge when no filters are active", () => {
    render(<HospitalFilter />);
    expect(screen.queryByText("1")).toBeNull();
  });

  it("should show filter tags when filters are active", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("city=北京&level=三级甲等"));
    render(<HospitalFilter />);
    expect(screen.getByText("当前筛选：")).toBeDefined();
    expect(screen.getByText(/^北京$/)).toBeDefined();
    expect(screen.getByText(/^三级甲等$/)).toBeDefined();
  });

  it("should navigate with city param when city select changes", () => {
    render(<HospitalFilter />);
    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "上海" } });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("city=%E4%B8%8A%E6%B5%B7"));
  });

  it("should navigate with level param when level select changes", () => {
    render(<HospitalFilter />);
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "二级甲等" } });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("level=%E4%BA%8C%E7%BA%A7%E7%94%B2%E7%AD%89"));
  });

  it("should navigate when clearing all filters", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("city=北京&level=三级甲等"));
    render(<HospitalFilter />);
    const clearButton = screen.getByText("清除");
    fireEvent.click(clearButton);
    expect(mockPush).toHaveBeenCalledWith("/hospitals");
  });

  it("should show clear keyword button when keyword input has value", () => {
    render(<HospitalFilter />);
    const input = screen.getByPlaceholderText("搜索医院名称...");
    fireEvent.change(input, { target: { value: "协和" } });
    // Since useDebounce returns value directly, the X button should appear
    const closeButton = document.querySelector("button.absolute.right-3");
    expect(closeButton).not.toBeNull();
  });
});
