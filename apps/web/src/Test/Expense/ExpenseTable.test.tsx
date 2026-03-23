import { deleteExpense } from "@/api/delete";
import { getExpenses, getExpenseSummary } from "@/api/get";
import { approveExpense, createExpense, rejectExpense } from "@/api/patch";
import ExpenseTable from "@/pages/Expense/ExpenseTable";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/components/common/PageMeta", () => ({
  default: () => null,
}));

vi.mock("@/components/common/Can", () => ({
  default: ({ children }: any) => children,
}));

vi.mock("@/api/get", () => ({
  getExpenses: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deleteExpense: vi.fn(),
}));

vi.mock("@/api/patch", () => ({
  approveExpense: vi.fn(),
  rejectExpense: vi.fn(),
  createExpense: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
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
vi.mock("@/components/ui/dropdown/Dropdown", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/common/DeleteConfirmModal", () => ({
  default: ({ children, onConfirm }: any) => {
    return children((id: number) => onConfirm(id));
  },
}));
beforeEach(() => {
  vi.spyOn(window, "addEventListener").mockImplementation(() => {});
});
describe("ExpenseTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    data: [
      {
        expenses: {
          id: 1,
          expenseType: "Food",
          amount: 1000,
          expenseDate: "2024-01-01",
          status: "DRAFT",
        },
        employee: {
          firstName: "John",
          lastName: "Doe",
        },
      },
    ],
    meta: { total: 1 },
  };

  it("should render expense data", async () => {
    (getExpenses as any).mockResolvedValue(mockData);

    renderWithProviders(<ExpenseTable />);

    await waitFor(() => {
      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("should search expenses", async () => {
    (getExpenses as any).mockResolvedValue(mockData);

    renderWithProviders(<ExpenseTable />);

    const input = await screen.findByPlaceholderText("Search by type");
    await userEvent.type(input, "Food");

    await waitFor(() => {
      expect(getExpenses).toHaveBeenCalled();
    });
  });

  it("should open dropdown and view details", async () => {
    (getExpenses as any).mockResolvedValue(mockData);

    renderWithProviders(<ExpenseTable />);

    await screen.findByText("Food");

    const buttons = await screen.findAllByRole("button");

    const menuBtn = buttons.find((btn) =>
      btn.innerHTML.includes("tabler-icon-dots-vertical"),
    );

    await userEvent.click(menuBtn!);

    const viewBtn = await screen.findByText(/view details/i);
    await userEvent.click(viewBtn);

    expect(await screen.findByText(/expense details/i)).toBeInTheDocument();
  });

  it("should navigate to expense edit", async () => {
    (getExpenses as any).mockResolvedValue(mockData);

    renderWithProviders(<ExpenseTable />);

    await screen.findByText("Food");

    const buttons = await screen.findAllByRole("button");

    const menuBtn = buttons.find((btn) =>
      btn.innerHTML.includes("tabler-icon-dots-vertical"),
    );

    await userEvent.click(menuBtn!);

    const editBtn = await screen.findByText(/edit/i);
    await userEvent.click(editBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/expenses/1");
  });

  it("should submit expense", async () => {
    (getExpenses as any).mockResolvedValue(mockData);
    (createExpense as any).mockResolvedValue({});

    renderWithProviders(<ExpenseTable />);

    await screen.findByText("Food");

    const menuBtn = await screen.findByRole("button", {
      name: "",
    });
    await userEvent.click(menuBtn);

    const submitBtn = await screen.findByRole("button", { name: /submit/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(createExpense).toHaveBeenCalled();
    });
  });

  it("should delete expense", async () => {
    (getExpenses as any).mockResolvedValue(mockData);
    (deleteExpense as any).mockResolvedValue({});

    renderWithProviders(<ExpenseTable />);

    await screen.findByText("Food");

    const buttons = await screen.findAllByRole("button");

    const menuBtn = buttons.find((btn) =>
      btn.innerHTML.includes("tabler-icon-dots-vertical"),
    );

    await userEvent.click(menuBtn!);
    const deleteBtn = await screen.findByText(/delete/i);
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteExpense).toHaveBeenCalled();
    });
  });

  it("should approve expense", async () => {
    (getExpenses as any).mockResolvedValue({
      data: [
        {
          expenses: {
            id: 1,
            expenseType: "Food",
            amount: 1000,
            expenseDate: "2024-01-01",
            status: "CREATED",
          },
          employee: { firstName: "John", lastName: "Doe" },
        },
      ],
      meta: { total: 1 },
    });

    (approveExpense as any).mockResolvedValue({});

    renderWithProviders(<ExpenseTable />);

    await screen.findByText("Food");

    const buttons = await screen.findAllByRole("button");

    const menuBtn = buttons.find((btn) =>
      btn.innerHTML.includes("tabler-icon-dots-vertical"),
    );

    await userEvent.click(menuBtn!);

    const approveBtn = await screen.findByRole("button", { name: /approve/i });

    await userEvent.click(approveBtn);

    await waitFor(() => {
      expect(approveExpense).toHaveBeenCalled();
    });
  });

  it("should reject expense", async () => {
    (getExpenses as any).mockResolvedValue({
      data: [
        {
          expenses: {
            id: 1,
            expenseType: "Food",
            amount: 1000,
            expenseDate: "2024-01-01",
            status: "CREATED",
          },
          employee: { firstName: "John", lastName: "Doe" },
        },
      ],
      meta: { total: 1 },
    });

    (rejectExpense as any).mockResolvedValue({});

    renderWithProviders(<ExpenseTable />);

    await screen.findByText("Food");

    const buttons = await screen.findAllByRole("button");

    const menuBtn = buttons.find((btn) =>
      btn.innerHTML.includes("tabler-icon-dots-vertical"),
    );

    await userEvent.click(menuBtn!);

    const rejectBtn = await screen.findByRole("button", { name: /reject/i });

    await userEvent.click(rejectBtn);

    const textarea = await screen.findByPlaceholderText("Reason...");
    await userEvent.type(textarea, "Invalid");

    const confirmBtn = await screen.findByRole("button", { name: /confirm/i });

    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(rejectExpense).toHaveBeenCalled();
    });
  });

  it("should fetch summary", async () => {
    (getExpenseSummary as any).mockResolvedValue({
      totalExpenses: 2,
      totalAmount: 5000,
    });

    renderWithProviders(<ExpenseTable />);

    const btn = await screen.findByText("View Summary");
    await userEvent.click(btn);

    await waitFor(() => {
      expect(getExpenseSummary).toHaveBeenCalled();
    });
  });
});
