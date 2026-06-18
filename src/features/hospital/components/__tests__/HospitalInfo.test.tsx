// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HospitalInfo from "../HospitalInfo";

const mockHospital = {
  id: "hospital-1",
  name: "北京协和医院",
  address: "北京市东城区王府井大街",
  city: "北京",
  level: "三级甲等",
  phone: "010-12345678",
  description: "这是一所综合医院",
  imageUrl: "https://example.com/hospital.jpg",
  departmentCount: 42,
  doctorCount: 256,
};

describe("HospitalInfo", () => {
  it("should render hospital name", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText("北京协和医院")).toBeDefined();
  });

  it("should render level badge", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText("三级甲等")).toBeDefined();
  });

  it("should render address", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText(/北京市东城区王府井大街/)).toBeDefined();
  });

  it("should render phone", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText(/010-12345678/)).toBeDefined();
  });

  it("should render department count", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText(/42 个/)).toBeDefined();
  });

  it("should render doctor count", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText(/256 位/)).toBeDefined();
  });

  it("should render description when provided", () => {
    render(<HospitalInfo hospital={mockHospital} />);
    expect(screen.getByText("这是一所综合医院")).toBeDefined();
    expect(screen.getByText("医院简介")).toBeDefined();
  });

  it("should not render description section when description is empty", () => {
    render(<HospitalInfo hospital={{ ...mockHospital, description: "" }} />);
    expect(screen.queryByText("医院简介")).toBeNull();
  });

  it("should render image banner when imageUrl is provided", () => {
    const { container } = render(<HospitalInfo hospital={mockHospital} />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("should render placeholder banner when imageUrl is empty", () => {
    const { container } = render(<HospitalInfo hospital={{ ...mockHospital, imageUrl: "" }} />);
    // The placeholder div has bg-gradient-to-r class
    const gradientDiv = container.querySelector(".bg-gradient-to-r");
    expect(gradientDiv).not.toBeNull();
  });

  it("should not render description when string is empty", () => {
    render(<HospitalInfo hospital={{ ...mockHospital, description: "" }} />);
    expect(screen.queryByText("医院简介")).toBeNull();
  });
});
