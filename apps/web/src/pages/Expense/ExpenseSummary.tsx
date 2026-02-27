import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getExpenseSummary } from "../../api/get";
import DatePicker from "../../components/form/date-picker";

export default function ExpenseSummary() {
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [run, setRun] = useState(false);

  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["expense-summary", fromDate, toDate],
    queryFn: () => getExpenseSummary(fromDate, toDate),
    enabled: run,
  });

  useEffect(() => {
    if (data) toast.success("Expense summary loaded!");
  }, [data]);

  useEffect(() => {
    if (error) toast.error(`Failed to fetch: ${error.message}`);
  }, [error]);
  const handleClear = () => {
    setFromDate(today);
    setToDate(today);
    setRun(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-end gap-3">
        <DatePicker
          id="dateRange"
          label="Select Date Range"
          mode="range"
          value={
            fromDate && toDate
              ? [new Date(fromDate), new Date(toDate)]
              : undefined
          }
          onChange={(dates) => {
            if (dates.length === 2) {
              setFromDate(dates[0].toLocaleDateString("en-CA"));
              setToDate(dates[1].toLocaleDateString("en-CA"));
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
        <button
          onClick={handleClear}
          className="h-[45px] rounded-lg border px-6 text-sm
               hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Clear
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
