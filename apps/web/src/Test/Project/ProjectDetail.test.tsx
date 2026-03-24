import { removeEmployeeFromProject } from "@/api/delete";
import { getEmployees, getProjectEmployees } from "@/api/get";
import { assignEmployeeToProject } from "@/api/post";
import ProjectDetail from "@/pages/Project/ProjectDetail";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getProjectEmployees: vi.fn(),
  getEmployees: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  assignEmployeeToProject: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  removeEmployeeFromProject: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "1" }),
    useLocation: () => ({
      state: { status: "ACTIVE" },
    }),
  };
});

describe("ProjectDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEmployees = {
    data: [
      {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      },
    ],
  };

  const allEmployees = {
    data: [
      {
        id: "1",
        firstName: "John",
        lastName: "Doe",
      },
      {
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
      },
    ],
  };

  it("should render employee data", async () => {
    (getProjectEmployees as any).mockResolvedValue(mockEmployees);

    renderWithProviders(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText(/John\s*Doe/i)).toBeInTheDocument();
    });
  });

  it("should navigate back", async () => {
    (getProjectEmployees as any).mockResolvedValue(mockEmployees);

    renderWithProviders(<ProjectDetail />);

    const btn = await screen.findByText("Back");
    await userEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/projects");
  });

  it("should open add team modal", async () => {
    (getProjectEmployees as any).mockResolvedValue(mockEmployees);
    (getEmployees as any).mockResolvedValue(allEmployees);

    renderWithProviders(<ProjectDetail />);

    const btn = await screen.findByText("Add Team Member");
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("Select Team Members")).toBeInTheDocument();
    });
  });

  it("should select employee and assign", async () => {
    (getProjectEmployees as any).mockResolvedValue(mockEmployees);
    (getEmployees as any).mockResolvedValue(allEmployees);

    (assignEmployeeToProject as any).mockResolvedValue({
      message: "Assigned",
    });

    renderWithProviders(<ProjectDetail />);

    const btn = await screen.findByText("Add Team Member");
    await userEvent.click(btn);

    const checkbox = await screen.findByText("Jane Smith");
    await userEvent.click(checkbox);

    const saveBtn = await screen.findByText("Save");
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(assignEmployeeToProject).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should close modal on cancel", async () => {
    (getProjectEmployees as any).mockResolvedValue(mockEmployees);
    (getEmployees as any).mockResolvedValue(allEmployees);

    renderWithProviders(<ProjectDetail />);

    const btn = await screen.findByText("Add Team Member");
    await userEvent.click(btn);

    const cancelBtn = await screen.findByText("Cancel");
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("Select Team Members")).not.toBeInTheDocument();
    });
  });

  it("should remove employee", async () => {
    (getProjectEmployees as any).mockResolvedValue(mockEmployees);

    (removeEmployeeFromProject as any).mockResolvedValue({
      message: "Removed",
    });

    renderWithProviders(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText(/John\s*Doe/i)).toBeInTheDocument();
    });

    const deleteBtn = document.querySelector(".text-red-600") as HTMLElement;

    await userEvent.click(deleteBtn);

    const confirmBtn = await screen.findByRole("button", {
      name: /delete/i,
    });

    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeEmployeeFromProject).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
