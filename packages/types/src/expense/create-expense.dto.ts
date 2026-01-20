export interface CreateExpenseDto {
  expenseType: string;
  amount: number;
  expenseDate: string;
  description?: string;
  file?: string;
}
