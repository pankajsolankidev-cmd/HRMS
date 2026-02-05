export interface UpdateExpenseDto {
  expenseType?: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  file?: string;
  status?: "DRAFT" | "CREATED";
}
