import { PayrollMonthType } from "../../../../apps/apis/src/db/schema/payroll.enums";

export interface PayrollFilterDto {
  month?: PayrollMonthType;
  year?: number;
  employeeId?: string;
}
