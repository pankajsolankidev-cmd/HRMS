import {
  IconCalendarOff,
  IconCircleCheck,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../api/get";
import Card from "../../components/common/ComponentCard";

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading)
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;

  if (isError)
    return <div className="p-6 text-red-500">Failed to load dashboard</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Employees
              </p>
              <h2 className="text-4xl font-bold text-blue-600 dark:text-blue mt-2">
                {data.totalEmployees}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <IconUsers
                size={26}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-emerald-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Available Today
              </p>
              <h2 className="text-4xl font-bold text-emerald-600 mt-2">
                {data.availableToday}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <IconCircleCheck
                size={26}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                On Leave Today
              </p>
              <h2 className="text-4xl font-bold text-red-500 mt-2">
                {data.onLeaveToday.count}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40">
              <IconCalendarOff
                size={26}
                className="text-red-500 dark:text-red-400"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Employees On Leave Today"
        className="bg-white dark:bg-slate-900"
      >
        {data.onLeaveToday.employees.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No employees on leave today
          </p>
        ) : (
          <div className="space-y-4">
            {data.onLeaveToday.employees.map((emp: any) => (
              <div
                key={emp.id}
                className="flex justify-between items-center border-gray-200 dark:border-gray-700 pb-3"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {emp.type} • {emp.fromDate} → {emp.toDate}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full">
                  {emp.totalDays} days
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Recent Leave Requests"
          className="bg-white dark:bg-slate-900"
        >
          {data.recentLeaves.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No recent leave requests
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentLeaves.map((leave: any) => (
                <div
                  key={leave.id}
                  className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {leave.employeeName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {leave.type}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      leave.status === "approved"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
                        : leave.status === "pending"
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40"
                          : "bg-rose-100 text-rose-600 dark:bg-rose-900/40"
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Expenses" className="bg-white dark:bg-slate-900">
          {data.recentExpenses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No recent expenses
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentExpenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {expense.employeeName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expense.expenseType}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      ₹{expense.amount}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        expense.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
                          : expense.status === "REJECTED"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/40"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/40"
                      }`}
                    >
                      {expense.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
