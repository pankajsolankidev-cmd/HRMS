import { getOrganization } from "@/api/get";
import { addOrganization } from "@/api/post";
import OrganizationForm from "@/pages/Organization/OrganizationForm";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/components/form/date-picker", () => ({
  default: ({ onChange, placeholder }: any) => (
    <input
      placeholder={placeholder}
      onChange={(e) => onChange(null, e.target.value)}
    />
  ),
}));

vi.mock("@/components/form/MultiSelect", () => ({
  default: ({ onChange }: any) => (
    <select
      multiple
      onChange={(e) =>
        onChange(Array.from(e.target.selectedOptions).map((o: any) => o.value))
      }
    >
      <option value="MONDAY">MONDAY</option>
      <option value="SUNDAY">SUNDAY</option>
    </select>
  ),
}));

vi.mock("@/api/get", () => ({
  getOrganization: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addOrganization: vi.fn(),
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

describe("OrganizationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    name: "Test Org",
    workingStartTime: "09:00",
    workingEndTime: "18:00",
    weekOff: ["MONDAY"],
  };

  it("should render add form", () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<OrganizationForm />);

    expect(screen.getByText("Add Organization")).toBeInTheDocument();
  });

  it("should show validation errors", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<OrganizationForm />);

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  it("should create organization successfully", async () => {
    mockParams.mockReturnValue({ id: "new" });

    (addOrganization as any).mockResolvedValue({
      message: "Created",
    });

    renderWithProviders(<OrganizationForm />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter organization name"),
      "Test Org",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Office Start Time"),
      "09:00",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Office End Time"),
      "18:00",
    );

    const select = screen.getByRole("listbox");
    await userEvent.selectOptions(select, ["MONDAY"]);

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(addOrganization).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/organization");
    });
  });

  it("should show error on create failure", async () => {
    mockParams.mockReturnValue({ id: "new" });

    (addOrganization as any).mockRejectedValue({
      response: { data: { message: "Error" } },
    });

    renderWithProviders(<OrganizationForm />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter organization name"),
      "Test",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Office Start Time"),
      "09:00",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Office End Time"),
      "18:00",
    );

    const select = screen.getByRole("listbox");
    await userEvent.selectOptions(select, ["MONDAY"]);

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error");
    });
  });

  it("should load data in edit mode", async () => {
    mockParams.mockReturnValue({ id: "1" });

    (getOrganization as any).mockResolvedValue(mockData);

    renderWithProviders(<OrganizationForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Org")).toBeInTheDocument();
    });
  });

  it("should navigate back", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<OrganizationForm />);

    await userEvent.click(screen.getByText("Back"));

    expect(mockNavigate).toHaveBeenCalledWith("/organization");
  });
});
