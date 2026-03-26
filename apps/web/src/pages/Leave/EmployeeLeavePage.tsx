import { getEmployees, getLeaveById, getManualLeaveById } from "@/api/get";
import { updateEmployeeLeave } from "@/api/patch";
import { addEmployeeLeave, uploadFile, type AddLeavePayload } from "@/api/post";
import ComponentCard from "@/components/common/Card";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Skeleton from "@/components/common/SkeletonForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router";
import type { LeaveFormData } from "./LeaveFormTemplate";
import LeaveForm from "./LeaveFormTemplate";

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
  const location = useLocation();
  const isManualLeave = location.pathname.includes("/leave-requests/manual");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id && id !== "new");

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getEmployees({
        excludeAssigned: true,
      }),
    enabled: !isEditMode,
  });

  const employeeOptions =
    employeesData?.data?.map((emp: any) => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp.id,
    })) ?? [];

  const { data, isLoading, isError } = useQuery({
    queryKey: [isManualLeave ? "manual-leave" : "leave", id],
    queryFn: () =>
      isManualLeave ? getManualLeaveById(id!) : getLeaveById(id!),
    enabled: isEditMode,
  });
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load leave data");
    }
  }, [isError]);

  const addMutation = useMutation<
    unknown,
    AxiosError<{ message?: string }>,
    AddLeavePayload & { employeeId: string }
  >({
    mutationFn: addEmployeeLeave,
    onSuccess: () => {
      toast.success("Employee leave added");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployeeLeave,
    onSuccess: () => {
      toast.success("Employee leave updated");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const normalizedLeave =
    isEditMode && data
      ? isManualLeave
        ? {
            ...data.leave,
            employeeId: data.employee.id,
          }
        : {
            ...data.leave,
            employeeId: data.leave.employeeId,
          }
      : null;

  const defaultValues: Partial<LeaveFormData> | undefined =
    isEditMode && normalizedLeave
      ? {
          fromDate: normalizedLeave.fromDate,
          toDate: normalizedLeave.toDate,
          type: normalizedLeave.type,
          dayType: normalizedLeave.dayType,
          reason: normalizedLeave.reason,
          fromHour: normalizedLeave.fromHour,
          toHour: normalizedLeave.toHour,
          fromHourType:
            normalizedLeave.fromHour === 4 ? "first_half" : "full_day",
          toHourType: normalizedLeave.toHour === 4 ? "first_half" : "full_day",
          employeeId: normalizedLeave.employeeId,
        }
      : undefined;

  const handleSubmit = async (data: LeaveFormData) => {
    try {
      let filePath: string | undefined = undefined;

      if (data.file instanceof File) {
        const uploadedFile = await uploadFile(data.file);
        filePath = uploadedFile.fileName;
      }

      const basePayload = mapFormToAddLeavePayload(data, filePath);

      if (isEditMode) {
        updateMutation.mutate({
          id: id!,
          payload: {
            ...basePayload,
            employeeId: data.employeeId!,
          },
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
    } catch (error) {
      toast.error("File upload failed. Please try again.");
    }
  };

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Employee Leave" : "Add Employee Leave"}
      />
      <Skeleton loading={isEditMode && isLoading}>
        <ComponentCard>
          <LeaveForm
            defaultValues={defaultValues}
            showEmployeeSelect={true}
            employeeOptions={employeeOptions}
            loading={addMutation.isPending || updateMutation.isPending}
            onBack={() => navigate("/leave-requests")}
            onSubmit={handleSubmit}
          />
        </ComponentCard>
      </Skeleton>
    </>
  );
}
