import { deleteSalaryStructure } from "@/api/delete";
import { getSalaryStructures } from "@/api/get";
import type { PaginatedResponse } from "@/api/types";
import Card from "@/components/common/Card";
import DeleteConfirm from "@/components/common/DeleteConfirmModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Input from "@/components/form/input/InputField";
import DataTable, {
  type Column,
} from "@/components/tables/BasicTables/DataTable";
import { useTableSort } from "@/components/tables/useTableSort";
import Button from "@/components/ui/button/Button";
import { IconEdit, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

export type SalaryStructure = {
  id: string;
  employeeName: string;
  basicSalary: number;
  description?: string;
  appraisalDate?: string;
  tax: number;
  pf: number;
  netSalary: number;
};

export default function SalaryTable() {
  const navigate = useNavigate();

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { sortBy, sortOrder, handleSort } = useTableSort<SalaryStructure>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);

  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<any>
  >({
    queryKey: [
      "salary-structures",
      page,
      limit,
      sortBy,
      sortOrder,
      search ?? "all",
    ],
    queryFn: () =>
      getSalaryStructures({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
        search,
      }),
    placeholderData: (prev) => prev,
  });
  const tableData =
    data?.data.map(({ salary, employees }: any) => ({
      ...salary,
      employeeName: `${employees.firstName} ${employees.lastName}`,
    })) ?? [];

  const total = data?.meta?.total ?? 0;

  const { mutate: removeSalary, isPending } = useMutation({
    mutationFn: deleteSalaryStructure,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Salary record deleted successfully");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const columns: Column<SalaryStructure>[] = [
    {
      header: "Employee",
      accessor: "employeeName",
      cell: (row) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.employeeName}
        </span>
      ),
    },
    {
      header: "Basic Salary",
      accessor: "basicSalary",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          ₹ {row.basicSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Tax",
      accessor: "tax",
      cell: (row) => (
        <span className="font-medium text-red-600 dark:text-red-400">
          ₹ {row.tax}
        </span>
      ),
    },
    {
      header: "PF",
      accessor: "pf",
      cell: (row) => (
        <span className="font-medium text-red-600 dark:text-red-400">
          ₹ {row.pf}
        </span>
      ),
    },
    {
      header: "Description",
      cell: (row) => row.description || "—",
    },
    {
      header: "Net Salary",
      accessor: "netSalary",
      cell: (row) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          ₹ {row.netSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/salary/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<string>
            title="Delete Salary Structure"
            description="Are you sure you want to delete this employee's salary record?"
            loading={isPending}
            onConfirm={(id) => removeSalary(id)}
          >
            {(onDelete) => (
              <IconTrash
                size={18}
                onClick={() => onDelete(row.id)}
                className="cursor-pointer text-red-600 dark:text-red-400"
              />
            )}
          </DeleteConfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Salary Management"
        description="Manage employee salary structures"
      />
      <PageBreadcrumb pageTitle="Salary" />

      <Card
        action={
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <div className="absolute left-3 top-3 text-gray-400">
                <IconSearch size={18} stroke={2} />
              </div>
              <Input
                placeholder="Search by name"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-10 pr-10 h-[42px] focus-visible:ring-0"
              />
              {rawSearch && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setRawSearch("");
                    setSearch(undefined);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                >
                  <IconX size={16} />
                </Button>
              )}
            </div>
            <Button
              onClick={() => navigate("/salary/new")}
              size="md"
              className="h-[42px] bg-black dark:bg-blue-500  whitespace-nowrap"
            >
              Add Salary
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </Card>
    </>
  );
}
