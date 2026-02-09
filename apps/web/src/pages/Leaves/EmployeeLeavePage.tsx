import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";

import { getEmployees, getLeaveById } from "../../api/get";
import { updateEmployeeLeave } from "../../api/patch";
import { addEmployeeLeave, type AddLeavePayload } from "../../api/post";
import Card from "../../components/common/ComponentCard";
import LeaveForm, { type LeaveFormData } from "./LeaveFormTemplate";

export const mapFormToAddLeavePayload = (
  data: LeaveFormData,
  filePath?: string,
): AddLeavePayload => ({
  fromDate: data.fromDate,
  toDate: data.toDate,
  type: data.type,
  dayType: data.dayType,
  reason: data.reason,
  fromHour: data.fromHour,
  toHour: data.toHour,
  file: filePath,
});

export default function EmployeeLeavePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id && id !== "new");

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getEmployees(),
    enabled: !isEditMode,
  });

  const employeeOptions =
    employeesData?.data?.map((emp: any) => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp.id,
    })) ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["leave", id],
    queryFn: () => getLeaveById(id!),
    enabled: isEditMode,
  });

  const addMutation = useMutation<
    unknown,
    unknown,
    AddLeavePayload & { employeeId: string }
  >({
    mutationFn: addEmployeeLeave,
    onSuccess: () => {
      toast.success("Employee leave added");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployeeLeave,
    onSuccess: () => {
      toast.success("Employee leave updated");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
  });

  if (isEditMode && isLoading) {
    return <div className="p-6 text-gray-500">Loading leave details…</div>;
  }

  const leave = data?.leave;

  const defaultValues: Partial<LeaveFormData> | undefined = isEditMode
    ? {
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        type: leave.type,
        dayType: leave.dayType,
        reason: leave.reason,
        fromHour: leave.fromHour,
        toHour: leave.toHour,
        fromHourType: leave.fromHour === 4 ? "first_half" : "full_day",
        toHourType: leave.toHour === 4 ? "first_half" : "full_day",
        employeeId: leave.employeeId,
      }
    : undefined;

  const handleSubmit = (data: LeaveFormData) => {
    const basePayload = mapFormToAddLeavePayload(data);

    if (isEditMode) {
      updateMutation.mutate({
        id: id!,
        payload: basePayload,
      });
      return;
    }

    if (!data.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    addMutation.mutate({
      ...basePayload,
      employeeId: data.employeeId,
    });
  };

  return (
    <Card title={isEditMode ? "Edit Employee Leave" : "Add Employee Leave"}>
      <LeaveForm
        defaultValues={defaultValues}
        showEmployeeSelect={!isEditMode}
        employeeOptions={employeeOptions}
        loading={addMutation.isPending || updateMutation.isPending}
        onBack={() => navigate("/leave-requests")}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}
