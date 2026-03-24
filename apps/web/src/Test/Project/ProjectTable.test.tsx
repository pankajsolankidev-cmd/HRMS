import { getProjects } from "@/api/get";
import { updateProject } from "@/api/put";
import ProjectTable from "@/pages/Project/ProjectTable";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updateProject: vi.fn(),
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
  };
});

describe("ProjectTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    data: [
      {
        id: 1,
        name: "Project A",
        clientName: "Client A",
        startDate: "2024-01-01",
        expectedEndDate: "2024-01-10",
        status: "ACTIVE",
      },
    ],
    meta: { total: 1 },
  };

  it("should render table data", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });
  });

  it("should navigate to add project", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    const btn = await screen.findByText("Add Projects");
    await userEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/projects/new");
  });

  it("should search project", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    const input = await screen.findByPlaceholderText("Search by project name");

    await userEvent.type(input, "Test");

    await waitFor(() => {
      expect(getProjects).toHaveBeenCalled();
    });
  });

  it("should clear search", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    const input = await screen.findByPlaceholderText("Search by project name");

    await userEvent.type(input, "Test");

    const clearBtn = document.querySelector("input + button") as HTMLElement;

    if (clearBtn) {
      await userEvent.click(clearBtn);
    }

    await waitFor(() => {
      expect(getProjects).toHaveBeenCalled();
    });
  });

  it("should open dropdown and navigate to edit", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    const dots = screen.getAllByRole("button").find(b => b.className.includes("p-1 rounded-full")) as HTMLButtonElement;
    await userEvent.click(dots);

    const editBtn = await screen.findByText((t) =>
      t.toLowerCase().includes("edit"),
    );

    await userEvent.click(editBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/projects/1");
  });

  it("should mark project as completed", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    (updateProject as any).mockResolvedValue({
      message: "Updated",
    });

    renderWithProviders(<ProjectTable />);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    const dots = screen.getAllByRole("button").find(b => b.className.includes("p-1 rounded-full")) as HTMLButtonElement;
    await userEvent.click(dots);

    const completeBtn = await screen.findByText((t) =>
      t.toLowerCase().includes("completed"),
    );

    await userEvent.click(completeBtn);

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should navigate to team page", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    const dots = screen.getAllByRole("button").find(b => b.className.includes("p-1 rounded-full")) as HTMLButtonElement;
    await userEvent.click(dots);

    const teamBtn = await screen.findByText((t) =>
      t.toLowerCase().includes("team"),
    );

    await userEvent.click(teamBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/projects/1/employees",
      expect.anything(),
    );
  });

  it("should change limit", async () => {
    (getProjects as any).mockResolvedValue(mockData);

    renderWithProviders(<ProjectTable />);

    const select = await screen.findByRole("combobox");

    await userEvent.selectOptions(select, "50");

    await waitFor(() => {
      expect(getProjects).toHaveBeenCalled();
    });
  });
});
