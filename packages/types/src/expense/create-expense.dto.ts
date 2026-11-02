export interface CreateExpenseDto {
  expenseType: string;
  amount: number;
  expenseDate: string;
  description?: string;
  file?: string;
}

export interface ExpenseEntity {
  id?: string;
  expenseType: string;
  amount: number;
  expenseDate: string;
  status?: "pending" | "approved" | "rejected" | "draft" | string;
  description?: string;
  file?: string;
  rejectionReason?: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
