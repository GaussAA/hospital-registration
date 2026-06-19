// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DoctorInfo from "../DoctorInfo";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/features/hospital/assets/doctor-avatar.svg", () => ({
  default: "doctor-avatar.svg",
}));

const mockDoctor = {
  id: "doctor-1",
  name: "张医生",
  title: "主任医师",
  specialty: "心血管内科",
  introduction: "从事心血管内科临床工作20年",
  avatarUrl: "https://example.com/avatar.jpg",
  hospitalName: "北京协和医院",
  departmentName: "内科",
};

describe("DoctorInfo", () => {
  it("should render doctor name", () => {
    render(<DoctorInfo doctor={mockDoctor} />);
    expect(screen.getByText("张医生")).toBeDefined();
  });

  it("should render doctor title badge", () => {
    render(<DoctorInfo doctor={mockDoctor} />);
    expect(screen.getByText("主任医师")).toBeDefined();
  });

  it("should render hospital and department info", () => {
    render(<DoctorInfo doctor={mockDoctor} />);
    expect(screen.getByText("北京协和医院 · 内科")).toBeDefined();
  });

  it("should render specialty", () => {
    render(<DoctorInfo doctor={mockDoctor} />);
    const specialtyElements = screen.getAllByText(/心血管内科/);
    expect(specialtyElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should render introduction when provided", () => {
    render(<DoctorInfo doctor={mockDoctor} />);
    expect(screen.getByText("医生简介")).toBeDefined();
    expect(screen.getByText("从事心血管内科临床工作20年")).toBeDefined();
  });

  it("should not render introduction section when introduction is empty", () => {
    render(<DoctorInfo doctor={{ ...mockDoctor, introduction: "" }} />);
    expect(screen.queryByText("医生简介")).toBeNull();
  });

  it("should render avatar image when avatarUrl is provided", () => {
    const { container } = render(<DoctorInfo doctor={mockDoctor} />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("should render fallback avatar when avatarUrl is empty", () => {
    const { container } = render(
      <DoctorInfo doctor={{ ...mockDoctor, avatarUrl: "" }} />,
    );
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("should not render when introduction is undefined", () => {
    const { introduction, ...doctorWithoutIntro } = mockDoctor;
    render(<DoctorInfo doctor={doctorWithoutIntro as typeof mockDoctor} />);
    expect(screen.queryByText("医生简介")).toBeNull();
  });
});
