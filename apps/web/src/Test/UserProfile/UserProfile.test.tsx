import { getProfile } from "@/api/get";
import UserProfile from "@/pages/UserProfile/UserProfile";
import { screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getProfile: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

describe("UserProfile Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    profile: {
      employee: {
        firstName: "Ayush",
        lastName: "Patel",
        email: "ayush@test.com",
        joiningDate: "2024-01-01",
        position: { name: "Frontend Dev" },
        department: { name: "IT" },
        manager: {
          firstName: "John",
          lastName: "Doe",
        },
        documents: {
          generateOfferLetter: true,
          generateAppointmentLetter: false,
        },
        system: {
          name: "MacBook",
          description: "M1 Pro",
          components: [{ id: 1, name: "Keyboard", code: "KB01" }],
        },
      },
    },
    organization: {
      name: "Test Org",
      workingStartTime: "9:00 AM",
      workingEndTime: "6:00 PM",
      weekOff: ["Saturday", "Sunday"],
    },
  };

  it("should show loading skeleton", () => {
    (getProfile as any).mockReturnValue(new Promise(() => {}));

    renderWithProviders(<UserProfile />);

    expect(screen.queryByText(/Ayush/i)).not.toBeInTheDocument();
  });

  it("should render profile data correctly", async () => {
    (getProfile as any).mockResolvedValue(mockData);

    renderWithProviders(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText("Ayush Patel")).toBeInTheDocument();
    });

    expect(screen.getByText("ayush@test.com")).toBeInTheDocument();
    expect(screen.getByText("Frontend Dev")).toBeInTheDocument();

    expect(screen.getByText("Test Org")).toBeInTheDocument();
    expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();

    expect(screen.getByText("MacBook")).toBeInTheDocument();
    expect(screen.getByText("M1 Pro")).toBeInTheDocument();

    expect(screen.getByText("Keyboard")).toBeInTheDocument();
    expect(screen.getByText("KB01")).toBeInTheDocument();
  });

  it("should show toast on error", async () => {
    (getProfile as any).mockRejectedValue(new Error("API Error"));

    renderWithProviders(<UserProfile />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load profile data");
    });
  });

  it("should show 'No system assigned' when system is null", async () => {
    (getProfile as any).mockResolvedValue({
      ...mockData,
      profile: {
        employee: {
          ...mockData.profile.employee,
          system: null,
        },
      },
    });

    renderWithProviders(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText("No system assigned")).toBeInTheDocument();
    });
  });

  it("should show 'No components assigned' when components empty", async () => {
    (getProfile as any).mockResolvedValue({
      ...mockData,
      profile: {
        employee: {
          ...mockData.profile.employee,
          system: {
            ...mockData.profile.employee.system,
            components: [],
          },
        },
      },
    });

    renderWithProviders(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText("No components assigned")).toBeInTheDocument();
    });
  });

  it("should show fallback values when data missing", async () => {
    (getProfile as any).mockResolvedValue({
      profile: {
        employee: {},
      },
      organization: {},
    });

    renderWithProviders(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText("No Position")).toBeInTheDocument();
    });
  });
});
