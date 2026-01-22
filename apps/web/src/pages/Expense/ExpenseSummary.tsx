import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getExpenseSummary } from "../../api/get";
import DatePicker from "../../components/form/date-picker";

export default function ExpenseSummary() {
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [run, setRun] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["expense-summary", fromDate, toDate],
    queryFn: () => getExpenseSummary(fromDate, toDate),
    enabled: run,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-end gap-3">
        <DatePicker
          id="fromDate"
          label="From Date"
          value={fromDate ? new Date(fromDate) : null}
          onChange={(dates) => {
            if (dates?.length) {
              setFromDate(dates[0].toLocaleDateString("en-CA"));
              setRun(false);
            }
          }}
        />

        <DatePicker
          id="toDate"
          label="To Date"
          value={toDate ? new Date(toDate) : null}
          onChange={(dates) => {
            if (dates?.length) {
              setToDate(dates[0].toLocaleDateString("en-CA"));
              setRun(false);
            }
          }}
        />

        <button
          onClick={() => setRun(true)}
          disabled={isFetching || !fromDate || !toDate}
          className="h-[45px] rounded-lg bg-black px-6 text-sm text-white
                     disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isFetching ? "Fetching..." : "View Summary"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
