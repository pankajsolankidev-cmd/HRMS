import { renderWithProviders } from "../AuthUtils";
import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import AdminDashboard from "@/pages/Dashboard/AdminDashboard";
import { getDashboard } from "@/api/get";

vi.mock("@/api/get", () => ({
    getDashboard: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
    default: { error: vi.fn() },
}));

const mockData = {
    totalEmployees: 10,
    availableToday: 8,
    onLeaveToday: {
        count: 2,
        employees: [
            {
                id: 1,
                firstName: "John",
                lastName: "Doe",
                type: "Sick",
                fromDate: "2024-01-01",
                toDate: "2024-01-02",
                totalDays: 2,
            },
        ],
    },
    recentLeaves: [
        {
            id: 1,
            employeeName: "Jane Doe",
            type: "Casual",
            status: "approved",
        },
    ],
    recentExpenses: [
        {
            id: 1,
            employeeName: "Mike",
            expenseType: "Travel",
            amount: 500,
        },
    ],
};

describe("AdminDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders dashboard data", async () => {
        (getDashboard as any).mockResolvedValue(mockData);

        renderWithProviders(<AdminDashboard />);

        expect(await screen.findByText("10")).toBeInTheDocument();
        expect(screen.getByText("8")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        expect(screen.getByText("₹500")).toBeInTheDocument();
    });

    it("shows empty states", async () => {
        (getDashboard as any).mockResolvedValue({
            totalEmployees: 0,
            availableToday: 0,
            onLeaveToday: { count: 0, employees: [] },
            recentLeaves: [],
            recentExpenses: [],
        });

        renderWithProviders(<AdminDashboard />);

        expect(
            await screen.findByText(/No employees on leave today/i),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/No recent leave requests/i),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/No recent expenses/i),
        ).toBeInTheDocument();
    });

    it("handles API error", async () => {
        (getDashboard as any).mockRejectedValue({
            response: { data: { message: "API Error" } },
        });

        renderWithProviders(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to load employees on leave/i)).toBeInTheDocument();
        });
    });
});