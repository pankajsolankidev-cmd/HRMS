import { getPublicHolidayById } from "@/api/get";
import { addPublicHoliday } from "@/api/post";
import { updatePublicHoliday } from "@/api/put";
import PublicHolidayForm from "@/pages/PublicHoliday/PublicHolidayForm";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/components/form/date-picker", () => ({
  default: ({ onChange }: any) => (
    <input
      placeholder="mock-date"
      onChange={(e) => onChange([new Date(e.target.value)])}
    />
  ),
}));

vi.mock("@/api/get", () => ({
  getPublicHolidayById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addPublicHoliday: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updatePublicHoliday: vi.fn(),
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

describe("PublicHolidayForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Add Holiday form", () => {
    mockParams.mockReturnValue({ id: "new" });
    renderWithProviders(<PublicHolidayForm />);
    expect(screen.getByText("Add Holiday")).toBeInTheDocument();
  });

  it("should show validation errors on submit", async () => {
    mockParams.mockReturnValue({ id: "new" });
    renderWithProviders(<PublicHolidayForm />);
    await clickButton("Save");
    await waitFor(() => {
      expect(
        screen.getByText(/Holiday title is required/i),
      ).toBeInTheDocument();
    });
  });

  it("should create holiday successfully", async () => {
    mockParams.mockReturnValue({ id: "new" });

    (addPublicHoliday as any).mockResolvedValue({
      message: "Created successfully",
    });

    renderWithProviders(<PublicHolidayForm />);

    await typeInput("Enter holiday title", "Diwali");

    const dates = screen.getAllByPlaceholderText("mock-date");
    await userEvent.type(dates[0], "2024-01-01");
    await userEvent.type(dates[1], "2024-01-02");

    await clickButton("Save");

    await waitFor(() => {
      expect(addPublicHoliday).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/holidays");
    });
  });

  it("should show error toast on API failure", async () => {
    mockParams.mockReturnValue({ id: "new" });

    (addPublicHoliday as any).mockRejectedValue({
      response: { data: { message: "API Error" } },
    });

    renderWithProviders(<PublicHolidayForm />);

    await typeInput("Enter holiday title", "Test");

    const dates = screen.getAllByPlaceholderText("mock-date");
    await userEvent.type(dates[0], "2024-01-01");
    await userEvent.type(dates[1], "2024-01-02");

    await clickButton("Save");

    await waitFor(() => {
      expect(addPublicHoliday).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("API Error");
    });
  });

  it("should load and populate data in edit mode", async () => {
    mockParams.mockReturnValue({ id: "1" });

    (getPublicHolidayById as any).mockResolvedValue({
      title: "Christmas",
      fromDate: "2024-12-25",
      toDate: "2024-12-25",
      description: "Holiday",
    });

    renderWithProviders(<PublicHolidayForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Christmas")).toBeInTheDocument();
    });
  });

  it("should update holiday in edit mode", async () => {
    mockParams.mockReturnValue({ id: "1" });

    (getPublicHolidayById as any).mockResolvedValue({
      title: "Old",
      fromDate: "2024-01-01",
      toDate: "2024-01-02",
    });

    (updatePublicHoliday as any).mockResolvedValue({
      message: "Updated successfully",
    });

    renderWithProviders(<PublicHolidayForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Old")).toBeInTheDocument();
    });

    await typeInput("Enter holiday title", "Updated");

    await clickButton("Update");

    await waitFor(() => {
      expect(updatePublicHoliday).toHaveBeenCalled();
    });
  });

  it("should navigate back on clicking Back", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<PublicHolidayForm />);

    await clickButton("Back");

    expect(mockNavigate).toHaveBeenCalledWith("/holidays");
  });

  it("should show date validation error", async () => {
    mockParams.mockReturnValue({ id: "new" });

    renderWithProviders(<PublicHolidayForm />);

    await typeInput("Enter holiday title", "Test");

    const dates = screen.getAllByPlaceholderText("mock-date");
    await userEvent.type(dates[0], "2024-01-05");
    await userEvent.type(dates[1], "2024-01-01");

    await clickButton("Save");

    await waitFor(() => {
      expect(addPublicHoliday).not.toHaveBeenCalled();
    });
  });
});
