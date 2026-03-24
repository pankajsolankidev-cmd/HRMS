import { deleteManualLeave } from "@/api/delete";
import { approveLeave, rejectLeave } from "@/api/patch";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeaveTable from "../../pages/Leave/LeaveTable";
import { renderWithProviders } from "../AuthUtils";

const mockNavigate = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-hot-toast", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

vi.mock("@/api/get", () => ({
  getLeaves: vi.fn().mockResolvedValue({
    data: [
      {
        leave: {
          id: "leave-123",
          fromDate: "2024-01-01",
          toDate: "2024-01-02",
          type: "sick",
          dayType: "full_day",
          status: "pending",
          reason: "Test Reason",
          totalDays: "2",
        },
        employee: {
          firstName: "John",
          lastName: "Doe",
          userId: "other-user-id",
        },
        createdByEmployee: { userId: "creator-id" },
      },
    ],
    meta: { total: 1 },
  }),
  getEmployees: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/api/delete", () => ({
  deleteLeave: vi.fn().mockResolvedValue({ message: "Deleted" }),
  deleteManualLeave: vi.fn().mockResolvedValue({ message: "Deleted" }),
}));

vi.mock("@/api/patch", () => ({
  approveLeave: vi.fn().mockResolvedValue({ message: "Approved" }),
  rejectLeave: vi.fn().mockResolvedValue({ message: "Rejected" }),
}));

const hrStore = configureStore({
  reducer: {
    auth: () => ({
      id: "hr-user-id",
      roles: ["HR"],
      permissions: ["leave.approve", "leave.reject", "leave.delete"],
    }),
  },
});

const creatorStore = configureStore({
  reducer: {
    auth: () => ({
      id: "creator-id",
      roles: ["HR"],
      permissions: ["leave.delete"],
    }),
  },
});

describe("LeaveTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComp = (store = hrStore) =>
    renderWithProviders(
      <HelmetProvider>
        <Provider store={store}>
          <LeaveTable />
        </Provider>
      </HelmetProvider>,
    );

  const openMenu = async () => {
    const row = await screen.findByRole("row", { name: /John Doe/i });
    const buttons = within(row).getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);
  };

  it("renders table", async () => {
    renderComp();
    expect(await screen.findByText("Leaves")).toBeInTheDocument();
  });

  it("approves leave → toast success", async () => {
    renderComp();
    await openMenu();

    await userEvent.click(await screen.findByText("Approve"));

    await waitFor(() => {
      expect(approveLeave).toHaveBeenCalled();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Approved");
  });

  it("rejects leave → toast success", async () => {
    renderComp();
    await openMenu();

    await userEvent.click(await screen.findByText("Reject"));

    const textarea = await screen.findByPlaceholderText("Enter reason...");
    await userEvent.type(textarea, "Invalid");

    await userEvent.click(screen.getByText("Confirm Reject"));

    await waitFor(() => {
      expect(rejectLeave).toHaveBeenCalled();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Rejected");
  });

  it("deletes leave → toast success", async () => {
    renderComp(creatorStore);
    await openMenu();

    await userEvent.click(await screen.findByText("Delete"));

    const btns = await screen.findAllByRole("button", { name: /^delete$/i });
    await userEvent.click(btns[btns.length - 1]);

    await waitFor(() => {
      expect(deleteManualLeave).toHaveBeenCalled();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Deleted");
  });

  it("approve error → toast error", async () => {
    (approveLeave as any).mockRejectedValue({
      response: { data: { message: "Approve Error" } },
    });

    renderComp();
    await openMenu();

    await userEvent.click(await screen.findByText("Approve"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Approve Error");
    });
  });

  it("reject error → toast error", async () => {
    (rejectLeave as any).mockRejectedValue({
      response: { data: { message: "Reject Error" } },
    });

    renderComp();
    await openMenu();

    await userEvent.click(await screen.findByText("Reject"));

    const textarea = await screen.findByPlaceholderText("Enter reason...");
    await userEvent.type(textarea, "Test");

    await userEvent.click(screen.getByText("Confirm Reject"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Reject Error");
    });
  });

  it("delete error → toast error", async () => {
    (deleteManualLeave as any).mockRejectedValue({
      response: { data: { message: "Delete Error" } },
    });

    renderComp(creatorStore);
    await openMenu();

    await userEvent.click(await screen.findByText("Delete"));

    const btns = await screen.findAllByRole("button", { name: /^delete$/i });
    await userEvent.click(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Delete Error");
    });
  });

  it("edit navigation works", async () => {
    renderComp(creatorStore);
    await openMenu();

    await userEvent.click(await screen.findByText("Edit"));

    expect(mockNavigate).toHaveBeenCalled();
  });
});
