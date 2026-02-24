import { IconBell, IconCheck } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { getNotifications, getUnreadCount } from "../../api/get";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/patch";
import { Dropdown } from "../ui/dropdown/Dropdown";

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { data, refetch } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: () => getNotifications(),
  });

  const allNotifications: Notification[] = data?.data ?? [];

  const unreadItems = allNotifications.filter((n) => !n.isRead);

  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      refetch();
      refetchUnreadCount();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      refetch();
      refetchUnreadCount();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-11 w-11 rounded-full border border-gray-200 bg-white dark:bg-gray-900"
      >
        <IconBell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
            {unreadCount}
          </span>
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute right-0 mt-4 flex h-[420px] w-[360px] flex-col rounded-2xl border bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
          <h5 className="text-lg font-semibold">Unread Notifications</h5>

          {unreadItems.length > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark All
            </button>
          )}
        </div>

        <ul className="flex-1 overflow-y-auto divide-y dark:divide-gray-800">
          {unreadItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              No unread notifications
            </div>
          ) : (
            unreadItems.map((notification) => (
              <li
                key={notification.id}
                className="px-4 py-3 flex justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => markOneMutation.mutate(notification.id)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Mark as Read"
                >
                  <IconCheck size={18} />
                </button>
              </li>
            ))
          )}
        </ul>

        <button
          onClick={() => {
            navigate("/notifications");
            setIsOpen(false);
          }}
          className="px-4 py-2 text-sm text-blue-600 border-t hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          View All Notifications
        </button>
      </Dropdown>
    </div>
  );
}
