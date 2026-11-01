import { deleteComponent } from "@/api/delete";
import { getComponents } from "@/api/get";
import ComponentTable from "@/pages/Component/ComponentTable";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getComponents: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deleteComponent: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/common/DeleteConfirmModal", () => ({
  default: ({ children, onConfirm }: any) => {
    return children((id: number) => onConfirm(id));
  },
}));

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ComponentTable Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getComponents as any).mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Dashboard UI",
          code: "UI-DB",
          description: "Main dashboard",
        },
      ],
      meta: { total: 1 },
    });
  });

  it("renders search and add button", () => {
    renderWithProviders(<ComponentTable />);

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
    expect(screen.getByText("Add Component")).toBeInTheDocument();
  });

  it("renders table data from API", async () => {
    renderWithProviders(<ComponentTable />);

    expect(await screen.findByText("Dashboard UI")).toBeInTheDocument();
    expect(screen.getByText("UI-DB")).toBeInTheDocument();
  });

  it("updates search input value", async () => {
    renderWithProviders(<ComponentTable />);

    const input = screen.getByPlaceholderText("Search by name");

    await userEvent.type(input, "test");

    expect(input).toHaveValue("test");
  });

  it("clears search when clicking clear button", async () => {
    renderWithProviders(<ComponentTable />);

    const input = screen.getByPlaceholderText("Search by name");

    await userEvent.type(input, "test");

    const buttons = await screen.findAllByRole("button");
    const clearBtn = buttons.find((btn) => btn.innerHTML.includes("svg"));

    fireEvent.click(clearBtn!);

    expect(input).toHaveValue("");
  });

  it("navigates to add component page", () => {
    renderWithProviders(<ComponentTable />);

    fireEvent.click(screen.getByText("Add Component"));

    expect(mockNavigate).toHaveBeenCalledWith("/components/new");
  });

  it("navigates to edit page", async () => {
    const { container } = renderWithProviders(<ComponentTable />);

    await screen.findByText("Dashboard UI");

    const editIcon = container.querySelector(".tabler-icon-edit");

    fireEvent.click(editIcon!);

    expect(mockNavigate).toHaveBeenCalledWith("/components/1");
  });

  it("calls delete API", async () => {
    (deleteComponent as any).mockResolvedValue({ message: "Deleted" });

    const { container } = renderWithProviders(<ComponentTable />);

    await screen.findByText("Dashboard UI");

    const deleteIcon = container.querySelector(".tabler-icon-trash");

    fireEvent.click(deleteIcon!);

    await waitFor(() => {
      expect(deleteComponent).toHaveBeenCalledWith(1, expect.anything());
    });
  });

  it("handles API error", async () => {
    (getComponents as any).mockRejectedValue(new Error("Error"));

    renderWithProviders(<ComponentTable />);

    await waitFor(() => {
      expect(getComponents).toHaveBeenCalled();
    });
  });
});
