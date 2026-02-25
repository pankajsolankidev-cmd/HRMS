import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

import { getNotifications } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import { useTableSort } from "../../components/tables/useTableSort";

type Notification = {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { sortBy, sortOrder, handleSort } = useTableSort<Notification>();

  const { data, isLoading, isError,refetch:notificationTable } = useQuery<
    PaginatedResponse<Notification>
  >({
    queryKey: ["notifications", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getNotifications({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const notifications = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Notification>[] = [
    {
      header: "Message",
      accessor: "message",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.message}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "isRead",
      cell: (row) => (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            row.isRead
              ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-300"
              : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          }`}
        >
          {row.isRead ? "Read" : "Unread"}
        </span>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
      cell: (row) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.createdAt).toLocaleString()}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Notifications" />

      <Card>
        <DataTable
          columns={columns}
          data={notifications}
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
