import { IconBell, IconCheck, IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getNotifications, getUnreadCount } from "../../api/get";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/patch";
import { Dropdown } from "../ui/dropdown/Dropdown";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    data: allNotifications = [],
    refetch: refetchAll,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: getNotifications,
  });

  const unreadItems = allNotifications.filter((n: any) => !n.isRead);

  const { data: unreadCount = 0, refetch: refetchCount } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
  });

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    refetchAll();
    refetchCount();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    refetchAll();
    refetchCount();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
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
        onClose={closeDropdown}
        className="absolute right-0 mt-4 flex h-[420px] w-[360px] flex-col rounded-2xl border bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
          <h5 className="text-lg font-semibold">Unread Notifications</h5>

          {unreadItems.length > 0 && (
            <button
              onClick={handleMarkAll}
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
            unreadItems.map((notification: any) => (
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
                  onClick={() => handleMarkRead(notification.id)}
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
            closeDropdown();
            setShowModal(true);
          }}
          className="px-4 py-2 text-sm text-blue-600 border-t hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          View All Notifications
        </button>
      </Dropdown>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">All Notifications</h2>
              <button onClick={() => setShowModal(false)}>
                <IconX size={20} />
              </button>
            </div>

            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">Failed to load notifications</p>
            ) : allNotifications.length === 0 ? (
              <p>No notifications found</p>
            ) : (
              <div className="space-y-3">
                {allNotifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs mt-1">
                      Status: {notification.isRead ? "Read" : "Unread"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
