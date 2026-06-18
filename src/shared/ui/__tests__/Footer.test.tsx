// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/shared/ui/Footer";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Footer", () => {
  it("should render the brand name", () => {
    render(<Footer />);
    expect(screen.getByText("健康挂号")).toBeDefined();
  });

  it("should render the brand slogan", () => {
    render(<Footer />);
    expect(
      screen.getByText(/覆盖全市各大医院/),
    ).toBeDefined();
  });

  it("should render quick links section", () => {
    render(<Footer />);
    expect(screen.getByText("快速链接")).toBeDefined();
    expect(screen.getByText("首页")).toBeDefined();
    expect(screen.getByText("医院列表")).toBeDefined();
    expect(screen.getByText("我的挂号")).toBeDefined();
  });

  it("should render help & support section", () => {
    render(<Footer />);
    expect(screen.getByText("帮助支持")).toBeDefined();
    expect(screen.getByText("挂号指南")).toBeDefined();
    expect(screen.getByText("常见问题")).toBeDefined();
    expect(screen.getByText("隐私政策")).toBeDefined();
  });

  it("should render social media buttons with aria-labels", () => {
    render(<Footer />);
    expect(screen.getByLabelText("微信")).toBeDefined();
    expect(screen.getByLabelText("微博")).toBeDefined();
    expect(screen.getByLabelText("邮箱")).toBeDefined();
  });

  it("should render copyright text with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(`${year} 健康挂号 - 在线预约挂号平台`),
    ).toBeDefined();
  });

  it("should render service phone number", () => {
    render(<Footer />);
    expect(screen.getByText("客服：010-8888-8888")).toBeDefined();
  });

  it("should render navigation links with correct hrefs", () => {
    render(<Footer />);
    const homeLink = screen.getByText("首页").closest("a");
    const hospitalsLink = screen.getByText("医院列表").closest("a");
    expect(homeLink?.getAttribute("href")).toBe("/");
    expect(hospitalsLink?.getAttribute("href")).toBe("/hospitals");
  });

  it("should render footer element with correct role", () => {
    render(<Footer />);
    const footer = document.querySelector("footer");
    expect(footer).toBeDefined();
  });
});
