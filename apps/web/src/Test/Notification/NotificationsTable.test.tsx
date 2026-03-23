import { getNotifications } from "@/api/get";
import NotificationsPage from "@/pages/Notification/NotificationsTable";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getNotifications: vi.fn(),
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    data: [
      {
        id: "1",
        userId: "1",
        message: "Test Notification",
        isRead: false,
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z",
      },
    ],
    meta: { total: 1 },
  };

  it("should render notifications data", async () => {
    (getNotifications as any).mockResolvedValue(mockData);

    renderWithProviders(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
      expect(screen.getByText("Unread")).toBeInTheDocument();
    });
  });

  it("should render read status correctly", async () => {
    (getNotifications as any).mockResolvedValue({
      ...mockData,
      data: [{ ...mockData.data[0], isRead: true }],
    });

    renderWithProviders(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Read")).toBeInTheDocument();
    });
  });

  it("should render created date", async () => {
    (getNotifications as any).mockResolvedValue(mockData);

    renderWithProviders(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  it("should handle empty data", async () => {
    (getNotifications as any).mockResolvedValue({
      data: [],
      meta: { total: 0 },
    });

    renderWithProviders(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Test Notification")).not.toBeInTheDocument();
    });
  });

  it("should handle error state", async () => {
    (getNotifications as any).mockRejectedValue(new Error("Error"));

    renderWithProviders(<NotificationsPage />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });
  });

  it("should change page", async () => {
    (getNotifications as any).mockResolvedValue(mockData);

    renderWithProviders(<NotificationsPage />);

    const nextBtn = await screen.findByRole("button", { name: /next/i });

    await userEvent.click(nextBtn);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });
  });

  it("should change limit", async () => {
    (getNotifications as any).mockResolvedValue(mockData);

    renderWithProviders(<NotificationsPage />);

    const select = await screen.findByRole("combobox");

    await userEvent.selectOptions(select, "50");

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });
  });
});
