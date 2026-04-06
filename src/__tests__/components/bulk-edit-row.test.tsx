import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkEditRow } from "@/components/catalog/bulk-edit-row";

describe("BulkEditRow", () => {
  const defaultProps = {
    name: "Wireless Headphones Pro",
    secondaryLabel: "Electronics",
    status: "Done" as const,
    isExpanded: false,
    onToggle: vi.fn(),
  };

  it("renders product name", () => {
    render(<BulkEditRow {...defaultProps} />);
    expect(screen.getByText("Wireless Headphones Pro")).toBeInTheDocument();
  });

  it("renders secondary label", () => {
    render(<BulkEditRow {...defaultProps} />);
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<BulkEditRow {...defaultProps} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<BulkEditRow {...defaultProps} onToggle={onToggle} />);
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders different status for Pending", () => {
    render(<BulkEditRow {...defaultProps} status="Pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
