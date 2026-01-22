import { useState } from "react";
import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import GetSalaryTable from "../Salary/GetSalaryTable";

export default function Salary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string | undefined>();

  return (
    <>
      <PageMeta title="Salary" description="Salary structure list" />

      <PageBreadcrumb pageTitle="Salary table" />

      <div className="space-y-6">
        <ComponentCard
          title="Salary Details"
          middle={
            <div className="flex w-full flex-wrap items-end gap-3 sm:flex-nowrap">
              <div className="w-full sm:max-w-xs">
                <Input
                  placeholder="Search employee..."
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
              onClick={() => navigate("/salary/new")}
              className="
                h-[42px] rounded-lg bg-black px-5 text-sm text-white
                dark:bg-white dark:text-black
              "
            >
              Add Salary
            </button>
          }
        >
          <GetSalaryTable search={search} />
        </ComponentCard>
      </div>
    </>
  );
}
