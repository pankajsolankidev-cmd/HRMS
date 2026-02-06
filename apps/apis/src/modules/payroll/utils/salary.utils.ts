export function calculateNetSalary({
  basicSalary,
  tax = 0,
  pf = 0,
}: {
  basicSalary: number;
  tax?: number;
  pf?: number;
}) {
  if (tax < 0 || pf < 0) {
    throw new Error("Tax and PF cannot be negative");
  }

  if (tax + pf > basicSalary) {
    throw new Error("Tax + PF cannot exceed basic salary");
  }

  return basicSalary - tax - pf;
}
