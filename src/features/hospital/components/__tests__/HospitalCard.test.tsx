// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HospitalCard from "../HospitalCard";

const mockHospital = {
  id: "hospital-1",
  name: "北京协和医院",
  level: "三级甲等",
  address: "北京市东城区王府井大街",
  departmentCount: 42,
  doctorCount: 256,
};

describe("HospitalCard", () => {
  it("should render hospital name", () => {
    render(<HospitalCard hospital={mockHospital} />);
    expect(screen.getByText("北京协和医院")).toBeDefined();
  });

  it("should render level badge with correct class for 三级甲等", () => {
    render(<HospitalCard hospital={mockHospital} />);
    const badge = screen.getByText("三级甲等");
    expect(badge.className).toContain("bg-green-100");
  });

  it("should render level badge with default class for unknown level", () => {
    render(<HospitalCard hospital={{ ...mockHospital, level: "未知等级" }} />);
    const badge = screen.getByText("未知等级");
    expect(badge.className).toContain("bg-gray-100");
  });

  it("should render address", () => {
    render(<HospitalCard hospital={mockHospital} />);
    expect(screen.getByText("北京市东城区王府井大街")).toBeDefined();
  });

  it("should render department count", () => {
    render(<HospitalCard hospital={mockHospital} />);
    expect(screen.getByText("42 个科室")).toBeDefined();
  });

  it("should render doctor count", () => {
    render(<HospitalCard hospital={mockHospital} />);
    expect(screen.getByText("256 位医生")).toBeDefined();
  });

  it("should render a link to hospital detail page", () => {
    render(<HospitalCard hospital={mockHospital} />);
    const link = screen.getByText("查看详情").closest("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("/hospitals/hospital-1");
  });

  it("should render all level badge styles correctly", () => {
    const levels: Array<[string, string]> = [
      ["三级甲等", "bg-green-100"],
      ["三级乙等", "bg-blue-100"],
      ["二级甲等", "bg-yellow-100"],
      ["二级乙等", "bg-orange-100"],
      ["一级甲等", "bg-gray-100"],
      ["一级乙等", "bg-gray-100"],
    ];

    for (const [level, expectedClass] of levels) {
      const { unmount } = render(<HospitalCard hospital={{ ...mockHospital, level }} />);
      const badge = screen.getByText(level);
      expect(badge.className).toContain(expectedClass);
      unmount();
    }
  });

  it("should handle zero counts", () => {
    render(<HospitalCard hospital={{ ...mockHospital, departmentCount: 0, doctorCount: 0 }} />);
    expect(screen.getByText("0 个科室")).toBeDefined();
    expect(screen.getByText("0 位医生")).toBeDefined();
  });
});
