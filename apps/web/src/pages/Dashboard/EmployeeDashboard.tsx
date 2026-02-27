import { IconBeach, IconCalendarStar } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeDashboard } from "../../api/get";
import Card from "../../components/common/ComponentCard";

export default function EmployeeDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: getEmployeeDashboard,
  });

  if (isLoading)
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;

  if (isError)
    return <div className="p-6 text-red-500">Failed to load dashboard</div>;

  const { leaveBalance, upcomingHoliday, currentProject } = data;

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Earned</p>
              <h2 className="text-4xl font-bold text-blue-600 mt-2">
                {leaveBalance.totalEarned}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <IconBeach size={26} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Used</p>
              <h2 className="text-4xl font-bold text-red-500 mt-2">
                {leaveBalance.totalUsed}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40">
              <IconCalendarStar size={26} className="text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-emerald-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Remaining Leave</p>
              <h2 className="text-4xl font-bold text-emerald-600 mt-2">
                {leaveBalance.remaining}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <IconCalendarStar size={26} className="text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Upcoming Holiday" className="bg-white dark:bg-slate-900">
        {upcomingHoliday ? (
          <div className="space-y-2">
            <p className="text-lg font-semibold">{upcomingHoliday.title}</p>
            <p className="text-sm text-gray-500">
              {upcomingHoliday.fromDate} → {upcomingHoliday.toDate}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {upcomingHoliday.description}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No upcoming holidays</p>
        )}
      </Card>

      <Card title="Current Project" className="bg-white dark:bg-slate-900">
        {currentProject ? (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{currentProject.name}</p>
              <p className="text-sm text-gray-500">
                Client: {currentProject.clientName}
              </p>
              <p className="text-sm text-gray-500">
                {currentProject.startDate} → {currentProject.expectedEndDate}
              </p>
            </div>

            <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-600">
              {currentProject.status}
            </span>
          </div>
        ) : (
          <p className="text-gray-500">No active project assigned</p>
        )}
      </Card>
    </div>
  );
}
