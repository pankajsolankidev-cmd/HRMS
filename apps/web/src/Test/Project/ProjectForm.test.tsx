import { getProjectById } from "@/api/get";
import { addProject } from "@/api/post";
import { updateProject } from "@/api/put";
import ProjectForm from "@/pages/Project/ProjectForm";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/components/form/date-picker", () => ({
  default: ({ onChange }: any) => (
    <input
      placeholder="mock-date"
      onChange={(e) => onChange(null, e.target.value)}
    />
  ),
}));

vi.mock("@/api/get", () => ({
  getProjectById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addProject: vi.fn(),
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
const mockParams = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams(),
  };
});

describe("ProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render add form", () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<ProjectForm />);

    expect(screen.getByText("Add Project")).toBeInTheDocument();
  });

  it("should show validation errors", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<ProjectForm />);

    await clickButton("Save");

    await waitFor(() => {
      expect(screen.getByText(/Project name is required/i)).toBeInTheDocument();
    });
  });

  it("should create project successfully", async () => {
    mockParams.mockReturnValue({ id: "new" });

    (addProject as any).mockResolvedValue({
      message: "Created",
    });

    renderWithProviders(<ProjectForm />);

    await typeInput("Enter project name", "Test Project");
    await typeInput("Enter client name", "Client");

    const dates = screen.getAllByPlaceholderText("mock-date");
    await userEvent.type(dates[0], "2024-01-01");
    await userEvent.type(dates[1], "2024-01-02");

    await clickButton("Save");

    await waitFor(() => {
      expect(addProject).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/projects");
    });
  });

  it("should show error on create failure", async () => {
    mockParams.mockReturnValue({ id: "new" });

    (addProject as any).mockRejectedValue({
      response: { data: { message: "Error" } },
    });

    renderWithProviders(<ProjectForm />);

    await typeInput("Enter project name", "Test");
    await typeInput("Enter client name", "Client");

    const dates = screen.getAllByPlaceholderText("mock-date");
    await userEvent.type(dates[0], "2024-01-01");
    await userEvent.type(dates[1], "2024-01-02");

    await clickButton("Save");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error");
    });
  });

  it("should load data in edit mode", async () => {
    mockParams.mockReturnValue({ id: "1" });

    (getProjectById as any).mockResolvedValue({
      name: "Project",
      clientName: "Client",
      startDate: "2024-01-01",
      expectedEndDate: "2024-01-02",
    });

    renderWithProviders(<ProjectForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Project")).toBeInTheDocument();
    });
  });

  it("should update project", async () => {
    mockParams.mockReturnValue({ id: "1" });

    (getProjectById as any).mockResolvedValue({
      name: "Old",
      clientName: "Client",
      startDate: "2024-01-01",
      expectedEndDate: "2024-01-02",
    });

    (updateProject as any).mockResolvedValue({
      message: "Updated",
    });

    renderWithProviders(<ProjectForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Old")).toBeInTheDocument();
    });

    await typeInput("Enter project name", "Updated");

    await clickButton("Update");

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should navigate back", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<ProjectForm />);

    await clickButton("Back");

    expect(mockNavigate).toHaveBeenCalledWith("/projects");
  });

  it("should block submit when end date is before start date", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<ProjectForm />);

    await typeInput("Enter project name", "Test");
    await typeInput("Enter client name", "Client");

    const dates = screen.getAllByPlaceholderText("mock-date");
    await userEvent.type(dates[0], "2024-01-05");
    await userEvent.type(dates[1], "2024-01-01");

    await clickButton("Save");

    await waitFor(() => {
      expect(addProject).not.toHaveBeenCalled();
    });
  });
});
