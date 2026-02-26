import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { deletePublicHoliday } from "../../api/delete";
import {
  downloadHolidayTemplate,
  exportPublicHolidayPDF,
  getPublicHolidays,
} from "../../api/get";
import { confirmHolidayImport, previewHolidayImport } from "../../api/post";
import type { PaginatedResponse } from "../../api/types";
import Card from "../../components/common/ComponentCard";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";
import type { RootState } from "../../context";

type PublicHoliday = {
  id: number;
  title: string;
  description?: string;
  fromDate: string;
  toDate: string;
};

type PreviewValidRow = Omit<PublicHoliday, "id">;

type PreviewErrorRow = {
  row: number;
  message: string;
};

type PreviewResponse = {
  totalRows: number;
  validCount: number;
  errorCount: number;
  validRows: PreviewValidRow[];
  errorRows: PreviewErrorRow[];
};

export default function PublicHolidayTable() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const roles = useSelector((state: RootState) => state.auth.roles);
  const isEmployee = roles.includes("EMPLOYEE");

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
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "application/pdf" });
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
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to download PDF. Please try again.",
      );
    },
  });

  const { mutate: downloadTemplate, isPending: isDownloadingTemplate } =
    useMutation({
      mutationFn: downloadHolidayTemplate,
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "holiday-template.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded successfully");
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        toast.error(
          error?.response?.data?.message ?? "Failed to download template",
        );
      },
    });

  const { mutate: previewImport } = useMutation({
    mutationFn: previewHolidayImport,
    onSuccess: (data: PreviewResponse) => {
      setPreviewData(data);
      toast.success("Preview loaded successfully");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Preview failed");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    previewImport(file);
  };

  const { mutate: confirmImport, isPending: isConfirming } = useMutation({
    mutationFn: confirmHolidayImport,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Holidays imported successfully");
      setPreviewData(null);
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "Import failed. Please try again.",
      );
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
      cell: (row: PublicHoliday) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.title}
        </div>
      ),
    },
    {
      header: "From Date",
      accessor: "fromDate",
      cell: (row: PublicHoliday) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(row.fromDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "To Date",
      accessor: "toDate",
      cell: (row: PublicHoliday) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(row.toDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      cell: (row: PublicHoliday) => (
        <div className="text-gray-600 dark:text-gray-400">
          {row.description ?? "-"}
        </div>
      ),
    },
    !isEmployee
      ? {
          header: "Action",
          align: "center",
          cell: (row: PublicHoliday) => (
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
        }
      : null,
  ].filter(Boolean) as Column<PublicHoliday>[];

  const previewValidColumns: Column<PreviewValidRow>[] = [
    {
      header: "Title",
      accessor: "title",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.title}
        </div>
      ),
    },
    {
      header: "From Date",
      accessor: "fromDate",
      cell: (row) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(row.fromDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "To Date",
      accessor: "toDate",
      cell: (row) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(row.toDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      cell: (row) => (
        <div className="text-gray-600 dark:text-gray-400">
          {row.description ?? "-"}
        </div>
      ),
    },
  ];

  const previewErrorColumns: Column<PreviewErrorRow>[] = [
    {
      header: "Row Number",
      accessor: "row",
      cell: (row) => (
        <div className="font-semibold text-red-600">#{row.row}</div>
      ),
    },
    {
      header: "Error Message",
      accessor: "message",
      cell: (row) => <div className="text-red-500 text-sm">{row.message}</div>,
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Public Holidays" />

      <Card
        action={
          <div className="flex justify-end gap-3">
            {!isEmployee && (
              <>
                <Button
                  onClick={() => navigate("/holidays/new")}
                  size="md"
                  className="bg-black text-white"
                >
                  Add Holiday
                </Button>

                <Button
                  onClick={() => downloadTemplate()}
                  size="md"
                  variant="outline"
                  disabled={isDownloadingTemplate}
                >
                  {isDownloadingTemplate
                    ? "Downloading..."
                    : "Download Template"}
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="md"
                  variant="outline"
                >
                  Import Excel
                </Button>

                <input
                  type="file"
                  accept=".xlsx"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}

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
            <p className="text-lg font-medium text-gray-700">
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

      {previewData && (
        <Card title="Import Preview" className="mt-5">
          <div className="space-y-6">
            <div className="flex gap-6 text-sm font-medium">
              <span>Total Rows: {previewData.totalRows}</span>
              <span className="text-green-600">
                Valid: {previewData.validCount}
              </span>
              <span className="text-red-600">
                Invalid: {previewData.errorCount}
              </span>
            </div>

            {previewData.validRows.length > 0 && (
              <DataTable
                columns={previewValidColumns}
                data={previewData.validRows}
                isLoading={false}
                isError={false}
                page={1}
                limit={previewData.validRows.length}
                total={previewData.validRows.length}
                onPageChange={() => {}}
                onLimitChange={() => {}}
              />
            )}

            {previewData.errorRows.length > 0 && (
              <DataTable
                columns={previewErrorColumns}
                data={previewData.errorRows}
                isLoading={false}
                isError={false}
                page={1}
                limit={previewData.errorRows.length}
                total={previewData.errorRows.length}
                onPageChange={() => {}}
                onLimitChange={() => {}}
              />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setPreviewData(null)}>
                Cancel
              </Button>

              <Button
                className="bg-green-600"
                disabled={
                  isConfirming ||
                  previewData.errorRows.length > 0 ||
                  previewData.validRows.length === 0
                }
                onClick={() => confirmImport(previewData.validRows)}
              >
                {isConfirming ? "Saving..." : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
