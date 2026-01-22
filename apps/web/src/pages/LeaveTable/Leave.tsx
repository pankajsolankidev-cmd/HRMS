import { useState } from "react";
import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import GetLeaveTable from "../Leaves/GetLeaveTable";

export default function Leave() {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string | undefined>();

  return (
    <>
      <PageMeta title="Leaves" description="Leave requests list" />

      <PageBreadcrumb pageTitle="Leave table" />

      <div className="space-y-6">
        <ComponentCard
          title="Leave Details"
          middle={
            <div className="flex w-full flex-wrap items-end gap-3 sm:flex-nowrap">
              <div className="w-full sm:max-w-xs">
                <Input
                  placeholder="Search leave..."
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
              onClick={() => navigate("/leave-requests/new")}
              className="
                h-[42px] rounded-lg bg-black px-5 text-sm text-white
                dark:bg-white dark:text-black
              "
            >
              Add Leave Request
            </button>
          }
        >
          <GetLeaveTable search={search} />
        </ComponentCard>
      </div>
    </>
  );
}
