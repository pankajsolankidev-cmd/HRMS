import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";

import { getLeaveById } from "../../api/get";
import { updateLeave } from "../../api/patch";
import { addLeave, type AddLeavePayload } from "../../api/post";
import Card from "../../components/common/ComponentCard";
import { mapFormToAddLeavePayload } from "./EmployeeLeavePage";
import LeaveForm, { type LeaveFormData } from "./LeaveFormTemplate";

export default function SelfLeavePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id && id !== "new");
  const { data, isLoading } = useQuery({
    queryKey: ["leave", id],
    queryFn: () => getLeaveById(id!),
    enabled: isEditMode,
  });

  const addMutation = useMutation<unknown, unknown, AddLeavePayload>({
    mutationFn: addLeave,
    onSuccess: () => {
      toast.success("Leave applied successfully");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLeave,
    onSuccess: () => {
      toast.success("Leave updated successfully");
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
      }
    : undefined;

  const handleSubmit = (data: LeaveFormData) => {
    const payload = mapFormToAddLeavePayload(data);

    if (isEditMode) {
      updateMutation.mutate({
        id: id!,
        payload,
      });
    } else {
      addMutation.mutate(payload);
    }
  };

  return (
    <Card title={isEditMode ? "Edit Leave Request" : "Apply Leave"}>
      <LeaveForm
        defaultValues={defaultValues}
        loading={addMutation.isPending || updateMutation.isPending}
        onBack={() => navigate("/leave-requests")}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}
