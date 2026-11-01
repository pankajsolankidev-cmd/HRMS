import { deleteDepartment } from "@/api/delete";
import { getDepartments } from "@/api/get";
import DepartmentTable from "@/pages/Department/DepartmentTable";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getDepartments: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deleteDepartment: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/common/PageBreadCrumb", () => ({
  default: () => <div>Breadcrumb</div>,
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

describe("DepartmentTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getDepartments as any).mockResolvedValue({
      data: [{ id: 1, name: "HR Department" }],
      meta: { total: 1 },
    });
  });

  it("renders department data", async () => {
    renderWithProviders(<DepartmentTable />);
    expect(await screen.findByText("HR Department")).toBeInTheDocument();
  });

  it("search input updates", async () => {
    renderWithProviders(<DepartmentTable />);

    await typeInput("Search by department name", "HR");

    expect(
      screen.getByPlaceholderText("Search by department name"),
    ).toHaveValue("HR");
  });

  it("clear search button works", async () => {
    const { container } = renderWithProviders(<DepartmentTable />);

    await typeInput("Search by department name", "HR");

    const clearBtn = container
      .querySelector(".tabler-icon-x")
      ?.closest("button");

    fireEvent.click(clearBtn!);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search by department name"),
      ).toHaveValue("");
    });
  });

  it("navigate to add department page", async () => {
    renderWithProviders(<DepartmentTable />);

    await clickButton("Add Department");

    expect(mockNavigate).toHaveBeenCalledWith("/departments/new");
  });

  it("navigate to edit department page", async () => {
    const { container } = renderWithProviders(<DepartmentTable />);

    await screen.findByText("HR Department");

    const editIcon = container.querySelector(".tabler-icon-edit");

    fireEvent.click(editIcon!);

    expect(mockNavigate).toHaveBeenCalledWith("/departments/1");
  });

  it("delete department", async () => {
    (deleteDepartment as any).mockResolvedValue({ message: "Deleted" });

    const { container } = renderWithProviders(<DepartmentTable />);

    await screen.findByText("HR Department");

    const deleteIcon = container.querySelector(".tabler-icon-trash");

    fireEvent.click(deleteIcon!);

    await waitFor(() => {
      expect(deleteDepartment).toHaveBeenCalled();
    });

    const firstArg = (deleteDepartment as any).mock.calls[0][0];
    expect(firstArg).toBe(1);
  });
});
