export const expenseStatusEnum = [
  "DRAFT",
  "CREATED",
  "APPROVED",
  "REJECTED",
] as const;

export type ExpenseStatus = (typeof expenseStatusEnum)[number];
