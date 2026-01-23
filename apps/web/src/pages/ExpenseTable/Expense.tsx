import { useState } from "react";
import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import ExpenseSummary from "../Expense/ExpenseSummary";
import GetExpenseTable from "../Expense/GetExpenseTable";

export default function Expense() {
  const navigate = useNavigate();

  const [search, setSearch] = useState<string | undefined>();

  return (
    <>
      <PageMeta title="Expenses" description="Expense list" />
      <PageBreadcrumb pageTitle="Expenses" />
      <div className="space-y-6">
        <ComponentCard title="Expense Summary">
          <ExpenseSummary />
        </ComponentCard>
        <ComponentCard
          title="Expense Details"
          middle={
            <div className="flex w-full flex-wrap items-end gap-3 sm:flex-nowrap">
              <div className="w-full sm:max-w-xs">
                <Input
                  placeholder="Search expense..."
                  value={search ?? ""}
                  onChange={(e) => setSearch(e.target.value || undefined)}
                />
              </div>

              {search && (
                <button
                  onClick={() => setSearch(undefined)}
                  className="
                  h-[42px] rounded-lg border border-gray-300
                  px-4 text-sm text-gray-700
                  dark:border-gray-700 dark:text-gray-300
                "
                >
                  Clear
                </button>
              )}
            </div>
          }
          action={
            <button
              onClick={() => navigate("/expenses/new")}
              className="
              h-[42px] rounded-lg bg-black px-5 text-sm text-white
              dark:bg-white dark:text-black
            "
            >
              Add Expense
            </button>
          }
        >
          <GetExpenseTable search={search} />
        </ComponentCard>
      </div>
    </>
  );
}
