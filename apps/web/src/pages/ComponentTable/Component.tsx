import { useState } from "react";
import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import GetComponentTable from "../Component/GetComponentTable";

export default function Component() {
  const navigate = useNavigate();

  const [search, setSearch] = useState<string | undefined>();

  return (
    <>
      <PageMeta title="Components" description="Component list" />
      <PageBreadcrumb pageTitle="Components" />

      <ComponentCard
        title="Component Details"
        middle={
          <div className="flex w-full flex-wrap items-end gap-3 sm:flex-nowrap">
            <div className="w-full sm:max-w-xs">
              <Input
                placeholder="Search component..."
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
            onClick={() => navigate("/components/new")}
            className="
              h-[42px] rounded-lg bg-black px-5 text-sm text-white
              dark:bg-white dark:text-black
            "
          >
            Add Component
          </button>
        }
      >
        <GetComponentTable search={search} />
      </ComponentCard>
    </>
  );
}
