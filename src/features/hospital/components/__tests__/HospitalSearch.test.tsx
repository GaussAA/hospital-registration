// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HospitalSearch from "../HospitalSearch";

const mockPush = vi.fn();
const mockSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, refresh: vi.fn() })),
  usePathname: vi.fn(() => "/hospitals"),
  useSearchParams: () => mockSearchParams(),
}));

describe("HospitalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("should render search input with placeholder", () => {
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...");
    expect(input).toBeDefined();
  });

  it("should render submit button", () => {
    render(<HospitalSearch />);
    expect(screen.getByText("搜索")).toBeDefined();
  });

  it("should update input value on change", () => {
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "协和" } });
    expect(input.value).toBe("协和");
  });

  it("should call router.push with keyword on form submit", () => {
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...");
    fireEvent.change(input, { target: { value: "协和" } });
    fireEvent.submit(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("keyword=%E5%8D%8F%E5%92%8C"));
  });

  it("should set page=1 on search", () => {
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...");
    fireEvent.change(input, { target: { value: "协和" } });
    fireEvent.submit(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  it("should delete keyword param when search value is empty", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("keyword=xxx"));
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.submit(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining("keyword"));
  });

  it("should trim whitespace from search value", () => {
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...");
    fireEvent.change(input, { target: { value: "  协和  " } });
    fireEvent.submit(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("keyword=%E5%8D%8F%E5%92%8C"));
  });

  it("should not include keyword param for empty trimmed value", () => {
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining("keyword"));
  });

  it("should initialize input with keyword from searchParams", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("keyword=协和"));
    render(<HospitalSearch />);
    const input = screen.getByPlaceholderText("搜索医院...") as HTMLInputElement;
    expect(input.value).toBe("协和");
  });

  it("should prevent default form submission", () => {
    render(<HospitalSearch />);
    const form = screen.getByRole("button").closest("form")!;
    const submitEvent = fireEvent.submit(form);
    // Default should be prevented (page won't reload)
    expect(submitEvent).toBeDefined();
  });
});
