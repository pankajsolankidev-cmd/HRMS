import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

import type { PaginatedResponse } from "../../api/types";

import { deletePublicHoliday } from "../../api/delete";
import { exportPublicHolidayPDF, getPublicHolidays } from "../../api/get";
import Card from "../../components/common/ComponentCard";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";

type PublicHoliday = {
  id: number;
  title: string;
  fromDate: string;
  toDate: string;
};

export default function PublicHolidayTable() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { sortBy, sortOrder, handleSort } = useTableSort<PublicHoliday>();

  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);

  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<PublicHoliday>
  >({
    queryKey: ["public-holidays", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getPublicHolidays({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
      }),
    placeholderData: (prev) => prev,
  });
  const { mutate: downloadPDF, isPending: isDownloading } = useMutation({
    mutationFn: exportPublicHolidayPDF,

    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "public-holidays.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    },

    onError: () => {
      toast.error("Failed to download PDF");
    },
  });

  const { mutate: removeHoliday, isPending } = useMutation({
    mutationFn: deletePublicHoliday,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Holiday Deleted Successfully");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const holidays = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<PublicHoliday>[] = [
    {
      header: "Title",
      accessor: "title",
      sortable: true,
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.title}
        </div>
      ),
    },
    {
      header: "From Date",
      accessor: "fromDate",
      sortable: true,
      cell: (row) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(row.fromDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "To Date",
      accessor: "toDate",
      sortable: true,
      cell: (row) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(row.toDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/holidays/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<number>
            title="Delete Holiday"
            description="Are you sure you want to delete this holiday?"
            loading={isPending}
            onConfirm={(id) => removeHoliday(id)}
          >
            {(askDelete) => (
              <IconTrash
                size={18}
                onClick={() => askDelete(row.id)}
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
      <PageBreadcrumb pageTitle="Public Holidays" />

      <Card
        action={
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => navigate("/holidays/new")}
              size="md"
              className="bg-black dark:bg-blue-500 dark:hover:bg-brand-600 whitespace-nowrap"
            >
              Add Holiday
            </Button>
            <Button
              onClick={() => downloadPDF()}
              size="md"
              variant="outline"
              disabled={isDownloading}
            >
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        }
      >
        {!isLoading && holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              No records found
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={holidays}
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
        )}
      </Card>
    </>
  );
}
