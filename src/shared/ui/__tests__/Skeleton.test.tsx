// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  CalendarSkeleton,
} from "@/shared/ui/Skeleton";

describe("Skeleton", () => {
  it("should render a skeleton div", () => {
    const { container } = render(<Skeleton />);
    const div = container.firstElementChild;
    expect(div).toBeDefined();
    expect(div?.className).toContain("rounded-xl");
    expect(div?.className).toContain("bg-[var(--bg-muted)]");
  });

  it("should apply custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const div = container.firstElementChild;
    expect(div?.className).toContain("custom-class");
  });

  it("should have overflow-hidden class", () => {
    const { container } = render(<Skeleton />);
    const div = container.firstElementChild;
    expect(div?.className).toContain("overflow-hidden");
  });

  it("should contain shimmer animation element", () => {
    const { container } = render(<Skeleton />);
    const innerDiv = container.firstElementChild?.firstElementChild;
    expect(innerDiv).toBeDefined();
    expect(innerDiv?.className).toContain("animate-shimmer");
  });
});

describe("CardSkeleton", () => {
  it("should render card skeleton structure", () => {
    const { container } = render(<CardSkeleton />);
    const card = container.firstElementChild;
    expect(card?.className).toContain("rounded-2xl");
    expect(card?.className).toContain("bg-[var(--bg-card)]");
  });

  it("should render avatar skeleton circle", () => {
    const { container } = render(<CardSkeleton />);
    const circles = container.querySelectorAll(".rounded-full");
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it("should render multiple skeleton bars", () => {
    const { container } = render(<CardSkeleton />);
    const skeletonBars = container.querySelectorAll("[class*='animate-shimmer']");
    expect(skeletonBars.length).toBeGreaterThanOrEqual(4);
  });
});

describe("TableSkeleton", () => {
  it("should render default 5 rows", () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll(".border-t");
    expect(rows.length).toBe(5);
  });

  it("should render custom number of rows", () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const rows = container.querySelectorAll(".border-t");
    expect(rows.length).toBe(3);
  });

  it("should render header row with skeleton bars", () => {
    const { container } = render(<TableSkeleton rows={1} />);
    const headerSkeletons = container.querySelectorAll(".px-4.py-3");
    expect(headerSkeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("should have 4 skeleton columns per row", () => {
    const { container } = render(<TableSkeleton rows={1} />);
    const header = container.querySelector(".px-4\\.py-3");
    const headerBars = header?.querySelectorAll("[class*='rounded-xl']") || [];
    expect(headerBars.length).toBe(4);
  });
});

describe("CalendarSkeleton", () => {
  it("should render calendar skeleton", () => {
    const { container } = render(<CalendarSkeleton />);
    const calendar = container.firstElementChild;
    expect(calendar?.className).toContain("rounded-2xl");
    expect(calendar?.className).toContain("bg-[var(--bg-card)]");
  });

  it("should render header with month skeleton bars", () => {
    const { container } = render(<CalendarSkeleton />);
    const header = container.querySelector(".border-b");
    expect(header).toBeDefined();
  });

  it("should render 3 rows of time slots", () => {
    const { container } = render(<CalendarSkeleton />);
    const rows = container.querySelectorAll(".flex.gap-3");
    expect(rows.length).toBe(3);
  });

  it("should render 7 day columns per row", () => {
    const { container } = render(<CalendarSkeleton />);
    const rows = container.querySelectorAll(".flex.gap-3");
    const firstRowDayCells = rows[0]?.querySelectorAll(".rounded-lg");
    expect(firstRowDayCells?.length).toBe(7);
  });
});
