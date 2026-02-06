export function calculateNetSalary({
  basicSalary,
  tax = 0,
  pf = 0,
}: {
  basicSalary: number | string;
  tax?: number | string;
  pf?: number | string;
}) {
  const basic = Number(basicSalary);
  const taxAmount = Number(tax);
  const pfAmount = Number(pf);

  if (Number.isNaN(basic) || Number.isNaN(taxAmount) || Number.isNaN(pfAmount)) {
    throw new Error("Invalid salary values");
  }

  if (taxAmount < 0 || pfAmount < 0) {
    throw new Error("Tax and PF cannot be negative");
  }

  if (taxAmount + pfAmount > basic) {
    throw new Error("Tax + PF cannot exceed basic salary");
  }

  return basic - taxAmount - pfAmount;
}
