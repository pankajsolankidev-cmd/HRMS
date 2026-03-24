import { getExpenseById } from "@/api/get";
import { addExpense, addExpenseDraft } from "@/api/post";
import { updateExpense } from "@/api/put";
import ExpenseForm from "@/pages/Expense/ExpenseForm";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getExpenseById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addExpense: vi.fn(),
  addExpenseDraft: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updateExpense: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
const mockParams = { id: "new" };

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});
vi.mock("@/components/form/date-picker", () => ({
  default: ({ value, onChange }: any) => {
    return (
      <input
        placeholder="Select expense date"
        value={value || ""}
        onClick={() => onChange([new Date("2024-01-01")])}
        onChange={() => {}}
      />
    );
  },
}));

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = "new";
    (getExpenseById as any).mockResolvedValue({
      expenseType: "",
      amount: 0,
      expenseDate: "",
    });
  });

  const fillForm = async () => {
    const typeInput = screen.getByPlaceholderText(
      /e.g. Travel, Food, Internet/i,
    );
    await userEvent.type(typeInput, "Food");
    const amountInput = screen.getByPlaceholderText("0.00");
    await userEvent.type(amountInput, "1000");
    const dateInput = screen.getByPlaceholderText(/select expense date/i);
    await userEvent.click(dateInput);
  };

  it("should add expense and navigate", async () => {
    mockParams.id = "new";
    (addExpense as any).mockResolvedValue({ message: "Success" });

    renderWithProviders(<ExpenseForm />);

    await fillForm();

    const saveBtn = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);

    await waitFor(
      () => {
        expect(addExpense).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/expenses");
      },
      { timeout: 3000 },
    );
  });

  it("should save draft and navigate", async () => {
    mockParams.id = "new";
    (addExpenseDraft as any).mockResolvedValue({ message: "Success" });

    renderWithProviders(<ExpenseForm />);

    await fillForm();

    const draftBtn = screen.getByRole("button", { name: /draft/i });
    await userEvent.click(draftBtn);

    await waitFor(() => {
      expect(addExpenseDraft).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/expenses");
    });
  });

  it("should navigate back on click", async () => {
    renderWithProviders(<ExpenseForm />);

    const backBtn = screen.getByRole("button", { name: /back/i });
    await userEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/expenses");
  });

  it("should load data and update expense", async () => {
    vi.mocked(getExpenseById).mockResolvedValue({
      expenseType: "Food",
      amount: 1000,
      expenseDate: "2024-01-01",
      description: "Test",
    });

    mockParams.id = "1";

    (updateExpense as any).mockResolvedValue({ message: "Updated" });

    renderWithProviders(<ExpenseForm />);

    await screen.findByDisplayValue("Food");

    const updateBtn = screen.getByRole("button", { name: /update/i });
    await userEvent.click(updateBtn);

    await waitFor(() => {
      expect(updateExpense).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/expenses");
    });
  });
});
