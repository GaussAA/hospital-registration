// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DoctorCard from "../DoctorCard";

const mockDoctor = {
  id: "doctor-1",
  name: "张医生",
  title: "主任医师",
  specialty: "心血管内科",
  avatarUrl: "https://example.com/avatar.jpg",
  hospitalId: "hospital-1",
  departmentId: "dept-1",
};

describe("DoctorCard", () => {
  it("should render doctor name", () => {
    render(<DoctorCard doctor={mockDoctor} />);
    expect(screen.getByText("张医生")).toBeDefined();
  });

  it("should render doctor title badge", () => {
    render(<DoctorCard doctor={mockDoctor} />);
    expect(screen.getByText("主任医师")).toBeDefined();
  });

  it("should render specialty", () => {
    render(<DoctorCard doctor={mockDoctor} />);
    expect(screen.getByText(/专长：心血管内科/)).toBeDefined();
  });

  it("should render image with avatarUrl when provided", () => {
    const { container } = render(<DoctorCard doctor={mockDoctor} />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("should render appointment link", () => {
    render(<DoctorCard doctor={mockDoctor} />);
    const link = screen.getByText("预约挂号").closest("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe(
      "/hospitals/hospital-1/departments/dept-1/doctors/doctor-1",
    );
  });

  it("should render fallback avatar when avatarUrl is empty", () => {
    const { container } = render(
      <DoctorCard doctor={{ ...mockDoctor, avatarUrl: "" }} />,
    );
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("should render with no specialty", () => {
    render(<DoctorCard doctor={{ ...mockDoctor, specialty: "" }} />);
    expect(screen.getByText(/专长：/)).toBeDefined();
  });
});
