// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DepartmentCard from "../DepartmentCard";

const mockDepartment = {
  id: "dept-1",
  name: "内科",
  description: "内科是医院的主要科室之一",
  doctorCount: 12,
  hospitalId: "hospital-1",
};

describe("DepartmentCard", () => {
  it("should render department name", () => {
    render(<DepartmentCard department={mockDepartment} />);
    expect(screen.getByText("内科")).toBeDefined();
  });

  it("should render description when provided", () => {
    render(<DepartmentCard department={mockDepartment} />);
    expect(screen.getByText("内科是医院的主要科室之一")).toBeDefined();
  });

  it("should not render description when empty", () => {
    render(<DepartmentCard department={{ ...mockDepartment, description: "" }} />);
    expect(screen.queryByText("内科是医院的主要科室之一")).toBeNull();
  });

  it("should render doctor count with badge when doctorCount > 0", () => {
    render(<DepartmentCard department={mockDepartment} />);
    expect(screen.getByText("12 位医生")).toBeDefined();
    // Badge should contain the number
    expect(screen.getByText("12")).toBeDefined();
  });

  it("should render '暂无医生' when doctorCount is 0", () => {
    render(<DepartmentCard department={{ ...mockDepartment, doctorCount: 0 }} />);
    expect(screen.getByText("暂无医生")).toBeDefined();
  });

  it("should render '暂无医生' when doctorCount is negative", () => {
    render(<DepartmentCard department={{ ...mockDepartment, doctorCount: 0 }} />);
    expect(screen.getByText("暂无医生")).toBeDefined();
  });

  it("should render link to doctor list page", () => {
    render(<DepartmentCard department={mockDepartment} />);
    const link = screen.getByText("查看医生").closest("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("/hospitals/hospital-1/departments/dept-1");
  });

  it("should render single doctor count correctly", () => {
    render(<DepartmentCard department={{ ...mockDepartment, doctorCount: 1 }} />);
    expect(screen.getByText("1 位医生")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("should render without description when not provided", () => {
    render(<DepartmentCard department={{ ...mockDepartment, description: "" }} />);
    expect(screen.queryByText("内科是医院的主要科室之一")).toBeNull();
  });
});
