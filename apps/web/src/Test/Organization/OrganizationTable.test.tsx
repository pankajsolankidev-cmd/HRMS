import { getOrganization } from "@/api/get";
import OrganizationTable from "@/pages/Organization/OrganizationTable";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getOrganization: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("OrganizationTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    id: "1",
    name: "Test Org",
    workingStartTime: "09:00",
    workingEndTime: "18:00",
    weekOff: ["Saturday", "Sunday"],
  };

  it("should render organization data", async () => {
    (getOrganization as any).mockResolvedValue(mockData);

    renderWithProviders(<OrganizationTable />);

    await waitFor(() => {
      expect(screen.getByText("Test Org")).toBeInTheDocument();
      expect(screen.getByText("09:00")).toBeInTheDocument();
      expect(screen.getByText("18:00")).toBeInTheDocument();
      expect(screen.getByText("Saturday, Sunday")).toBeInTheDocument();
    });
  });

  it("should navigate to add organization", async () => {
    (getOrganization as any).mockResolvedValue(mockData);

    renderWithProviders(<OrganizationTable />);

    const btn = await screen.findByText("Add Organization");
    await userEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/organization/new");
  });

  it("should navigate to edit organization", async () => {
    (getOrganization as any).mockResolvedValue(mockData);

    renderWithProviders(<OrganizationTable />);

    await waitFor(() => {
      expect(screen.getByText("Test Org")).toBeInTheDocument();
    });

    const editIcon = document.querySelector(".text-blue-600") as HTMLElement;

    await userEvent.click(editIcon);

    expect(mockNavigate).toHaveBeenCalledWith("/organization/1");
  });

  it("should handle empty data", async () => {
    (getOrganization as any).mockResolvedValue(null);

    renderWithProviders(<OrganizationTable />);

    await waitFor(() => {
      expect(screen.queryByText("Test Org")).not.toBeInTheDocument();
    });
  });

  it("should handle error state", async () => {
    (getOrganization as any).mockRejectedValue(new Error("Error"));

    renderWithProviders(<OrganizationTable />);

    await waitFor(() => {
      expect(getOrganization).toHaveBeenCalled();
    });
  });
});
