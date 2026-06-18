// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DepartmentList from "../DepartmentList";

const mockDepartments = [
  {
    id: "dept-1",
    name: "内科",
    description: "内科简介",
    doctorCount: 12,
    hospitalId: "hospital-1",
  },
  {
    id: "dept-2",
    name: "外科",
    description: "外科简介",
    doctorCount: 8,
    hospitalId: "hospital-1",
  },
  {
    id: "dept-3",
    name: "儿科",
    description: "",
    doctorCount: 0,
    hospitalId: "hospital-1",
  },
];

describe("DepartmentList", () => {
  it("should render empty state when departments array is empty", () => {
    render(<DepartmentList departments={[]} />);
    expect(screen.getByText("暂无科室信息")).toBeDefined();
  });

  it("should render department cards when departments are provided", () => {
    render(<DepartmentList departments={mockDepartments} />);
    expect(screen.getByText("内科")).toBeDefined();
    expect(screen.getByText("外科")).toBeDefined();
    expect(screen.getByText("儿科")).toBeDefined();
  });

  it("should render correct number of department cards", () => {
    const { container } = render(<DepartmentList departments={mockDepartments} />);
    // Each department card has a h3 element with the name
    const h3Elements = container.querySelectorAll("h3");
    expect(h3Elements.length).toBe(3);
  });

  it("should pass doctorCount correctly to DepartmentCard", () => {
    render(<DepartmentList departments={mockDepartments} />);
    expect(screen.getByText("12 位医生")).toBeDefined();
    expect(screen.getByText("8 位医生")).toBeDefined();
    expect(screen.getByText("暂无医生")).toBeDefined();
  });

  it("should handle single department", () => {
    render(<DepartmentList departments={[mockDepartments[0]]} />);
    expect(screen.getByText("内科")).toBeDefined();
    expect(screen.queryByText("外科")).toBeNull();
  });

  it("should not render empty state when departments exist", () => {
    render(<DepartmentList departments={mockDepartments} />);
    expect(screen.queryByText("暂无科室信息")).toBeNull();
  });

  it("should render grid layout class", () => {
    const { container } = render(<DepartmentList departments={mockDepartments} />);
    const gridDiv = container.querySelector(".grid");
    expect(gridDiv).not.toBeNull();
    expect(gridDiv!.className).toContain("grid-cols-1");
  });

  it("should render empty state wrapper with correct styling", () => {
    const { container } = render(<DepartmentList departments={[]} />);
    const emptyDiv = container.querySelector(".text-center");
    expect(emptyDiv).not.toBeNull();
    expect(emptyDiv!.className).toContain("py-12");
  });
});
