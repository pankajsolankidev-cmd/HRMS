import { useState } from "react";
import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import GetSystemTable from "../System/GetSystemTable";

export default function System() {
  const navigate = useNavigate();

  const [search, setSearch] = useState<string | undefined>();

  return (
    <>
      <PageMeta title="Systems" description="System list" />
      <PageBreadcrumb pageTitle="System tables" />

      <div className="space-y-6">
        <ComponentCard
          title="System Details"
          middle={
            <div className="flex w-full flex-wrap items-end gap-3 sm:flex-nowrap">
              <div className="w-full sm:max-w-xs">
                <Input
                  placeholder="Search system..."
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
              onClick={() => navigate("/systems/new")}
              className="
                h-[42px] rounded-lg bg-black px-5 text-sm text-white
                dark:bg-white dark:text-black
              "
            >
              Add System
            </button>
          }
        >
          <GetSystemTable search={search} />
        </ComponentCard>
      </div>
    </>
  );
}
