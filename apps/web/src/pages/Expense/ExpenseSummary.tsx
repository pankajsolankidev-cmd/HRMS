import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getExpenseSummary } from "../../api/get";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

const MONTHS = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export default function ExpenseSummary() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [month, setMonth] = useState<number>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const [run, setRun] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["expense-summary", month, year],
    queryFn: () => getExpenseSummary(month, year),
    enabled: run,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-end gap-3">
        <Select
          options={MONTHS}
          value={String(month)}
          onChange={(v) => {
            setMonth(Number(v));
            setRun(false);
          }}
          className="w-[160px]"
        />

        <Input
          type="number"
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setRun(false);
          }}
          className="w-[120px]"
        />

        <button
          onClick={() => setRun(true)}
          disabled={isFetching}
          className="h-[42px] rounded-lg bg-black px-6 text-sm text-white
                     disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isFetching ? "Fetching..." : "View Summary"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 ">
        <SummaryCard label="Total Expenses" value={data?.totalExpenses ?? 0} />

        <SummaryCard
          label="Total Amount"
          value={`₹ ${Number(data?.totalAmount ?? 0).toLocaleString("en-IN")}`}
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
