export const expenseStatusEnum = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;

export type ExpenseStatus = (typeof expenseStatusEnum)[number];
