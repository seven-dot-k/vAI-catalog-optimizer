import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/catalog/status-badge";

describe("StatusBadge", () => {
  it("renders Pending status", () => {
    render(<StatusBadge status="Pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders InProgress status with spinner", () => {
    const { container } = render(<StatusBadge status="InProgress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders Done status", () => {
    render(<StatusBadge status="Done" />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders Failed status", () => {
    render(<StatusBadge status="Failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
