import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkEditExpanded } from "@/components/catalog/bulk-edit-expanded";

describe("BulkEditExpanded", () => {
  const defaultProps = {
    currentContent: {
      shortDescription: "Current short",
      longDescription: "Current long description",
    },
    currentSeo: {
      metaTitle: "Current Title",
      metaDescription: "Current meta description",
    },
    proposedContent: {
      shortDescription: "Proposed short",
      longDescription: "Proposed long description",
    },
    proposedSeo: {
      metaTitle: "Proposed Title",
      metaDescription: "Proposed meta description",
    },
    onContentChange: vi.fn(),
  };

  it("renders current content as read-only", () => {
    render(<BulkEditExpanded {...defaultProps} />);
    expect(screen.getByText("Current short")).toBeInTheDocument();
    expect(screen.getByText("Current long description")).toBeInTheDocument();
  });

  it("renders proposed content in textareas", () => {
    render(<BulkEditExpanded {...defaultProps} />);
    const textareas = screen.getAllByRole("textbox");
    expect(textareas.length).toBeGreaterThanOrEqual(4);
    expect(textareas[0]).toHaveValue("Proposed short");
  });

  it("calls onContentChange when proposed text is edited", async () => {
    const user = userEvent.setup();
    const onContentChange = vi.fn();
    render(
      <BulkEditExpanded {...defaultProps} onContentChange={onContentChange} />
    );
    const textareas = screen.getAllByRole("textbox");
    await user.clear(textareas[0]);
    await user.type(textareas[0], "New text");
    expect(onContentChange).toHaveBeenCalled();
  });

  it("shows placeholder when no proposed content", () => {
    render(
      <BulkEditExpanded
        {...defaultProps}
        proposedContent={undefined}
        proposedSeo={undefined}
      />
    );
    const textareas = screen.getAllByRole("textbox");
    expect(textareas[0]).toHaveValue("");
  });

  it("renders Current and Proposed column headers", () => {
    render(<BulkEditExpanded {...defaultProps} />);
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Proposed")).toBeInTheDocument();
  });
});
