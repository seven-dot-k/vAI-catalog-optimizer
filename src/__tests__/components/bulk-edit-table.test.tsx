import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkEditTable, type BulkEditItem } from "@/components/catalog/bulk-edit-table";

const makeItem = (
  id: string,
  name: string,
  status: BulkEditItem["status"]
): BulkEditItem => ({
  id,
  name,
  secondaryLabel: "Electronics",
  status,
  currentContent: {
    shortDescription: "Current short",
    longDescription: "Current long",
  },
  currentSeo: {
    metaTitle: "Current Title",
    metaDescription: "Current meta",
  },
  proposedContent:
    status === "Done"
      ? { shortDescription: "Proposed short", longDescription: "Proposed long" }
      : undefined,
  proposedSeo:
    status === "Done"
      ? { metaTitle: "Proposed Title", metaDescription: "Proposed meta" }
      : undefined,
});

describe("BulkEditTable", () => {
  const defaultProps = {
    title: "Product Descriptions",
    description: "Generating descriptions",
    entityType: "product" as const,
    items: [
      makeItem("1", "Product A", "Done"),
      makeItem("2", "Product B", "Done"),
      makeItem("3", "Product C", "Pending"),
    ],
    pendingApproval: false,
    onApprove: vi.fn(),
  };

  it("renders title and description", () => {
    render(<BulkEditTable {...defaultProps} />);
    expect(screen.getByText("Product Descriptions")).toBeInTheDocument();
    expect(screen.getByText("Generating descriptions")).toBeInTheDocument();
  });

  it("renders all item rows", () => {
    render(<BulkEditTable {...defaultProps} />);
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByText("Product C")).toBeInTheDocument();
  });

  it("shows progress count", () => {
    render(<BulkEditTable {...defaultProps} />);
    expect(screen.getByText("2 of 3 complete")).toBeInTheDocument();
  });

  it("disables Approve button when no save tool is pending", () => {
    render(<BulkEditTable {...defaultProps} pendingApproval={false} />);
    const approveBtn = screen.getByRole("button", {
      name: /approve & save/i,
    });
    expect(approveBtn).toBeDisabled();
  });

  it("enables Approve button when save tool is pending", () => {
    const allDone = {
      ...defaultProps,
      pendingApproval: true,
      items: [
        makeItem("1", "Product A", "Done"),
        makeItem("2", "Product B", "Done"),
      ],
    };
    render(<BulkEditTable {...allDone} />);
    const approveBtn = screen.getByRole("button", {
      name: /approve & save/i,
    });
    expect(approveBtn).not.toBeDisabled();
  });

  it("calls onApprove when Approve is clicked", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const allDone = {
      ...defaultProps,
      pendingApproval: true,
      onApprove,
      items: [
        makeItem("1", "Product A", "Done"),
        makeItem("2", "Product B", "Done"),
      ],
    };
    render(<BulkEditTable {...allDone} />);
    await user.click(
      screen.getByRole("button", { name: /approve & save/i })
    );
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("shows Category column header for product entityType", () => {
    render(<BulkEditTable {...defaultProps} />);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows Catalog column header for category entityType", () => {
    render(<BulkEditTable {...defaultProps} entityType="category" />);
    expect(screen.getByText("Catalog")).toBeInTheDocument();
  });
});
