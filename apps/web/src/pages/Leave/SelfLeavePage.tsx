import { getLeaveById } from "@/api/get";
import { updateLeave } from "@/api/patch";
import { addLeave, uploadFile, type AddLeavePayload } from "@/api/post";
import Card from "@/components/common/Card";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Skeleton from "@/components/common/SkeletonForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { mapFormToAddLeavePayload } from "./EmployeeLeavePage";
import LeaveForm, { type LeaveFormData } from "./LeaveFormTemplate";

export default function SelfLeavePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id && id !== "new");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leave", id],
    queryFn: () => getLeaveById(id!),
    enabled: isEditMode,
  });
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load leave data");
    }
  }, [isError]);

  const addMutation = useMutation<unknown, unknown, AddLeavePayload>({
    mutationFn: addLeave,
    onSuccess: () => {
      toast.success("Leave applied successfully");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLeave,
    onSuccess: () => {
      toast.success("Leave updated successfully");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const leave = data?.leave;

  const defaultValues: Partial<LeaveFormData> | undefined =
    isEditMode && leave
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
        }
      : undefined;

  const handleSubmit = async (data: LeaveFormData) => {
    try {
      let filePath: string | undefined = undefined;

      if (data.file instanceof File) {
        const uploadedFile = await uploadFile(data.file);
        filePath = uploadedFile.fileName;
      }

      const payload = mapFormToAddLeavePayload(data, filePath);

      if (isEditMode) {
        updateMutation.mutate({
          id: id!,
          payload,
        });
      } else {
        addMutation.mutate(payload);
      }
    } catch (error) {
      toast.error("File upload failed. Please try again.");
    }
  };

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Leave Request" : "Apply Leave"}
      />
      <Skeleton loading={isEditMode && isLoading}>
        <Card>
          <LeaveForm
            defaultValues={defaultValues}
            loading={addMutation.isPending || updateMutation.isPending}
            onBack={() => navigate("/leave-requests")}
            onSubmit={handleSubmit}
          />
        </Card>
      </Skeleton>
    </>
  );
}
