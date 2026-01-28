import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import type { AxiosError } from "axios";
import { deleteSalaryStructure } from "../../api/delete";
import { getEmployees, getSalaryStructures } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

export type SalaryStructure = {
  id: string;
  employeeName: string;
  basicSalary: number;
  description?: string;
  appraisalDate?: string;
};

type Props = {
  search?: string;
};

export default function GetSalaryTable({ search }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof SalaryStructure | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (field: keyof SalaryStructure) => {
    if (sortBy === field) {
      setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const { data: employees } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () =>
      getEmployees({
        page: 1,
        limit: 100,
      }),
  });

  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    employees?.data?.forEach((emp: any) => {
      map.set(emp.id, `${emp.firstName} ${emp.lastName}`);
    });
    return map;
  }, [employees]);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<any>>({
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
        sortBy: sortBy as string | undefined,
        sortOrder,
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const total = data?.meta?.total ?? 0;

  const salaryData: SalaryStructure[] = useMemo(
    () =>
      data?.data?.map((s: any) => ({
        id: s.id,
        employeeName: employeeMap.get(s.employeeId) ?? "—",
        basicSalary: Number(s.basicSalary),
        description: s.description,
        appraisalDate: s.appraisalDate
          ? s.appraisalDate.split("T")[0]
          : undefined,
      })) ?? [],
    [data, employeeMap],
  );

  const { mutate: remove } = useMutation({
    mutationFn: deleteSalaryStructure,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Salary Deleted Successfully");
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
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
      header: "Description",
      cell: (row) => row.description || "-",
    },
    {
      header: "Appraisal Date",
      accessor: "appraisalDate",
      cell: (row) => row.appraisalDate || "-",
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/salary/${row.id}`)}
            className="cursor-pointer text-blue-600"
          />
          <IconTrash
            size={18}
            onClick={() =>
              confirm("Delete salary structure?") && remove(row.id)
            }
            className="cursor-pointer text-red-600"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {!isLoading && salaryData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No matching salary records found
          </p>

          {search && (
            <p className="mt-1 text-sm text-gray-500">
              No results matching{" "}
              <span className="font-medium">"{search}"</span>
            </p>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={salaryData}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {salaryData.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)}{" "}
            of {total}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
