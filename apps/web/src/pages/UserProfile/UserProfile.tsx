import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../../api/get";
import Chip from "../../components/common/Chip";

const UserProfile = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading profile...
      </div>
    );

  if (isError)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Failed to load profile
      </div>
    );

  const employee = data?.profile?.employee;
  const organization = data?.organization;

  const initials =
    employee?.firstName?.charAt(0) + employee?.lastName?.charAt(0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
              {initials?.toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {employee?.email}
              </p>

              <div className="mt-2 flex gap-3">
                <Chip
                  label={employee?.position?.name || "No Position"}
                  className="px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-600 rounded-full"
                />

                <Chip
                  label="Active Employee"
                  className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-5 text-gray-800 dark:text-white">
              Basic Information
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Joining Date</span>
                <span className="font-medium">{employee?.joiningDate}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Department</span>
                <span className="font-medium">
                  {employee?.department?.name || "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Manager</span>
                <span className="font-medium">
                  {employee?.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-5 text-gray-800 dark:text-white">
              Organization Details
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Organization</span>
                <span className="font-medium">{organization?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Working Hours</span>
                <span className="font-medium">
                  {organization?.workingStartTime} -{" "}
                  {organization?.workingEndTime}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Week Off</span>
                <span className="font-medium">
                  {organization?.weekOff?.join(", ")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-5 text-gray-800 dark:text-white">
              Documents
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Generate Offer Letter</span>
                <span
                  className={`font-medium ${
                    employee?.documents?.generateOfferLetter
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {employee?.documents?.generateOfferLetter ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Generate Appointment Letter
                </span>
                <span
                  className={`font-medium ${
                    employee?.documents?.generateAppointmentLetter
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {employee?.documents?.generateAppointmentLetter
                    ? "Yes"
                    : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-5 text-gray-800 dark:text-white">
              System Details
            </h2>

            {employee?.system ? (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">System Name</span>
                  <span className="font-medium">{employee.system.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {employee.system.description}
                  </span>
                </div>

                <div className="pt-4 border-t dark:border-gray-700">
                  <h3 className="text-sm font-semibold mb-3">
                    Assigned Components
                  </h3>

                  {employee.system.components?.length > 0 ? (
                    <div className="space-y-2">
                      {employee.system.components.map((component: any) => (
                        <div
                          key={component.id}
                          className="flex justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                        >
                          <span>{component.name}</span>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            {component.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">
                      No components assigned
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No system assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
