import { getEmployeeDashboard } from "@/api/get";
import Card from "@/components/common/Card";
import Skeleton from "@/components/common/SkeletonForm";
import {
  IconBeach,
  IconCalendarCheck,
  IconCalendarOff,
  IconChartLine,
  IconClock,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function EmployeeDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: getEmployeeDashboard,
    retry: false,
  });
  useEffect(() => {
    if (isError) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(
        err?.response?.data?.message ?? "Failed to load dashboard data",
      );
    }
  }, [isError, error]);

  const {
    leaveBalance = {},
    upcomingHoliday = null,
    currentProjects = [],
    completedProjectCount = 0,
  } = data ?? {};

  return (
    <Skeleton loading={isLoading}>
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-purple-50 dark:bg-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Months Worked</p>
                <h2 className="text-4xl font-bold text-purple-600 mt-2">
                  {leaveBalance.monthsWorked ?? 0}
                </h2>
              </div>
              <IconClock size={26} className="text-purple-600" />
            </div>
          </Card>

          <Card className="bg-blue-50 dark:bg-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Earned</p>
                <h2 className="text-4xl font-bold text-blue-600 mt-2">
                  {leaveBalance.totalEarned ?? 0}
                </h2>
              </div>
              <IconBeach size={26} className="text-blue-600" />
            </div>
          </Card>

          <Card className="bg-emerald-50 dark:bg-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Monthly Accrual</p>
                <h2 className="text-4xl font-bold text-emerald-600 mt-2">
                  {leaveBalance.monthlyAccrual ?? 0}
                </h2>
              </div>
              <IconTrendingUp size={26} className="text-emerald-600" />
            </div>
          </Card>

          <Card className="bg-rose-50 dark:bg-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Used</p>
                <h2 className="text-4xl font-bold text-rose-600 mt-2">
                  {leaveBalance.totalUsed ?? 0}
                </h2>
              </div>
              <IconCalendarOff size={26} className="text-rose-600" />
            </div>
          </Card>

          <Card className="bg-teal-50 dark:bg-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Remaining Leave</p>
                <h2 className="text-4xl font-bold text-teal-600 mt-2">
                  {leaveBalance.remaining ?? 0}
                </h2>
              </div>
              <IconCalendarCheck size={26} className="text-teal-600" />
            </div>
          </Card>

          <Card className="bg-amber-50 dark:bg-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Projects</p>
                <h2 className="text-4xl font-bold text-amber-600 mt-2">
                  {completedProjectCount ?? 0}
                </h2>
              </div>
              <IconChartLine size={26} className="text-amber-600" />
            </div>
          </Card>
        </div>

        <Card title="Upcoming Holiday" className="bg-white dark:bg-slate-900">
          {isError ? (
            <p className="text-red-500">Failed to load holiday information</p>
          ) : upcomingHoliday ? (
            <>
              <p className="text-lg font-semibold">{upcomingHoliday.title}</p>
              <p className="text-sm text-gray-500">
                {upcomingHoliday.fromDate} → {upcomingHoliday.toDate}
              </p>
              <p className="text-gray-600">{upcomingHoliday.description}</p>
            </>
          ) : (
            <p>No upcoming holidays</p>
          )}
        </Card>

        <Card title="Current Projects" className="bg-white dark:bg-slate-900">
          {isError ? (
            <p className="text-red-500">Failed to load project data</p>
          ) : currentProjects.length === 0 ? (
            <p>No active project assigned</p>
          ) : (
            <div className="space-y-4">
              {currentProjects.map((project: any) => (
                <div
                  key={project.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-gray-500">
                      {project.clientName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {project.startDate} → {project.expectedEndDate}
                    </p>
                  </div>

                  <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Skeleton>
  );
}
