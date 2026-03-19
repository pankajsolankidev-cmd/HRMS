import { renderWithProviders } from "../AuthUtils";
import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import EmployeeDashboard from "@/pages/Dashboard/EmployeeDashboard";
import { getEmployeeDashboard } from "@/api/get";

vi.mock("@/api/get", () => ({
    getEmployeeDashboard: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
    default: { error: vi.fn() },
}));

const mockData = {
    leaveBalance: {
        monthsWorked: 12,
        totalEarned: 20,
        monthlyAccrual: 2,
        totalUsed: 5,
        remaining: 15,
    },
    upcomingHoliday: {
        title: "Diwali",
        fromDate: "2024-11-01",
        toDate: "2024-11-02",
        description: "Festival holiday",
    },
    currentProjects: [
        {
            id: 1,
            name: "HRM System",
            clientName: "ABC Corp",
            startDate: "2024-01-01",
            expectedEndDate: "2024-06-01",
            status: "Active",
        },
    ],
    completedProjectCount: 3,
};

describe("EmployeeDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders dashboard data", async () => {
        (getEmployeeDashboard as any).mockResolvedValue(mockData);

        renderWithProviders(<EmployeeDashboard />);

        expect(await screen.findByText("12")).toBeInTheDocument();
        expect(screen.getByText("20")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();

        expect(screen.getByText("Diwali")).toBeInTheDocument();
        expect(screen.getByText("HRM System")).toBeInTheDocument();
    });

    it("shows empty states", async () => {
        (getEmployeeDashboard as any).mockResolvedValue({
            leaveBalance: {},
            upcomingHoliday: null,
            currentProjects: [],
            completedProjectCount: 0,
        });

        renderWithProviders(<EmployeeDashboard />);

        expect(await screen.findByText(/No upcoming holidays/i)).toBeInTheDocument();
        expect(screen.getByText(/No active project assigned/i)).toBeInTheDocument();
    });

    it("handles error", async () => {
        (getEmployeeDashboard as any).mockRejectedValue({});

        renderWithProviders(<EmployeeDashboard />);

        expect(
            await screen.findByText(/Failed to load holiday information/i),
        ).toBeInTheDocument();
    });
});