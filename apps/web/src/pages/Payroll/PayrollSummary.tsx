import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getPayrollSummary } from "../../api/get";
import Select from "../../components/form/Select";
import { MONTHS } from "./PayrollPage";

export default function PayrollSummary() {
  const currentMonth = new Date()
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();

  const START_YEAR = 2020;

  const CURRENT_YEAR = new Date().getFullYear();

  const YEAR_OPTIONS = Array.from(
    { length: CURRENT_YEAR - START_YEAR + 1 },
    (_, i) => {
      const year = CURRENT_YEAR - i;
      return {
        label: year.toString(),
        value: year.toString(),
      };
    },
  );

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState<number | null>(CURRENT_YEAR);

  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  const [appliedYear, setAppliedYear] = useState<number | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["payroll-summary", appliedMonth, appliedYear],
    queryFn: () => getPayrollSummary(appliedMonth!, appliedYear!),
    enabled: Boolean(appliedMonth && appliedYear),
  });

  const handleProcess = () => {
    if (!month || !year) return;
    setAppliedMonth(month);
    setAppliedYear(year);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-end gap-3">
        <div className="w-40">
          <Select
            options={MONTHS}
            value={month}
            onChange={setMonth}
            className="w-[160px]"
            placeholder="Select month"
          />
        </div>
        <div className="w-32">
          <Select
            options={YEAR_OPTIONS}
            value={year?.toString() ?? ""}
            onChange={(v) => setYear(v ? Number(v) : null)}
            className="w-[120px]"
            placeholder="Select year"
          />
        </div>

        <button
          onClick={handleProcess}
          disabled={isFetching}
          className="h-[45px] rounded-lg bg-black px-6 text-sm text-white
                     disabled:opacity-50 dark:bg-blue-500 dark:text-white"
        >
          {isFetching ? "Processing..." : "Process Payroll"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Employees" value={data?.employeesProcessed ?? 0} />
        <SummaryCard
          label="Avg Salary"
          value={`₹ ${(data?.avgSalary ?? 0).toLocaleString("en-IN")}`}
        />
        <SummaryCard
          label="Net Payroll"
          value={`₹ ${(data?.netPayroll ?? 0).toLocaleString("en-IN")}`}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border bg-gray-100 p-4 dark:bg-gray-900">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
