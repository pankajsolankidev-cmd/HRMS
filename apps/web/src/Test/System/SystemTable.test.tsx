import { deleteSystem } from "@/api/delete";
import { getSystems } from "@/api/get";
import SystemTable from "@/pages/System/SystemTable";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getSystems: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deleteSystem: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/common/PageMeta", () => ({
  default: () => null,
}));

vi.mock("@/components/common/DeleteConfirmModal", () => ({
  default: ({ children, onConfirm }: any) => {
    return children((id: number) => onConfirm(id));
  },
}));

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SystemTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getSystems as any).mockResolvedValue({
      data: [
        {
          id: 1,
          name: "System A",
          description: "Desc",
          components: [{ id: "1", name: "Comp1", code: "C1" }],
        },
      ],
      meta: { total: 1 },
    });
  });

  it("renders table data", async () => {
    renderWithProviders(<SystemTable />);

    expect(await screen.findByText("System A")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("Comp1 (C1)")).toBeInTheDocument();
  });

  it("search input updates", async () => {
    renderWithProviders(<SystemTable />);

    const input = screen.getByPlaceholderText("Search by name");
    await userEvent.type(input, "test");

    expect(input).toHaveValue("test");
  });

  it("navigate to add page", () => {
    renderWithProviders(<SystemTable />);

    fireEvent.click(screen.getByText("Add System"));

    expect(mockNavigate).toHaveBeenCalledWith("/systems/new");
  });

  it("navigate to edit page", async () => {
    const { container } = renderWithProviders(<SystemTable />);

    await screen.findByText("System A");

    const editIcon = container.querySelector(".tabler-icon-edit");

    fireEvent.click(editIcon!);

    expect(mockNavigate).toHaveBeenCalledWith("/systems/1");
  });

  it("delete system", async () => {
    (deleteSystem as any).mockResolvedValue({ message: "Deleted" });

    const { container } = renderWithProviders(<SystemTable />);

    await screen.findByText("System A");

    const deleteIcon = container.querySelector(".tabler-icon-trash");

    fireEvent.click(deleteIcon!);

    await waitFor(() => {
      expect(deleteSystem).toHaveBeenCalled();
    });
  });
});
