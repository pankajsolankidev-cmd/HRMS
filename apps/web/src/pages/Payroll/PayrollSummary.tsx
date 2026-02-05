import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getPayrollSummary } from "../../api/get";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

const MONTHS = [
  { label: "January", value: "JANUARY" },
  { label: "February", value: "FEBRUARY" },
  { label: "March", value: "MARCH" },
  { label: "April", value: "APRIL" },
  { label: "May", value: "MAY" },
  { label: "June", value: "JUNE" },
  { label: "July", value: "JULY" },
  { label: "August", value: "AUGUST" },
  { label: "September", value: "SEPTEMBER" },
  { label: "October", value: "OCTOBER" },
  { label: "November", value: "NOVEMBER" },
  { label: "December", value: "DECEMBER" },
];

export default function PayrollSummary() {
  const currentMonth = new Date()
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  const [appliedYear, setAppliedYear] = useState<number | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["payroll-summary", appliedMonth, appliedYear],
    queryFn: () => getPayrollSummary(appliedMonth!, appliedYear!),
    enabled: Boolean(appliedMonth && appliedYear),
  });

  const handleProcess = () => {
    setAppliedMonth(month);
    setAppliedYear(year);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-end gap-3">
        <Select
          options={MONTHS}
          value={month}
          onChange={setMonth}
          className="w-[160px]"
        />

        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-[120px]"
        />

        <button
          onClick={handleProcess}
          disabled={isFetching}
          className="h-[45px] rounded-lg bg-black px-6 text-sm text-white
                     disabled:opacity-50 dark:bg-white dark:text-black"
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
