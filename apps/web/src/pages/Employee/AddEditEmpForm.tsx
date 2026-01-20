import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import { getEmployeeById, getSystems } from "../../api/get";
import { addEmployee } from "../../api/post";
import { updateEmployee } from "../../api/put";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import Checkbox from "../../components/form/input/Checkbox";
import toast from "react-hot-toast";

export type EmployeePayload = {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;

  departmentId?: string | null;
  managerId?: string | null;
  systemId?: string | null;

  documents: {
    generateOfferLetter: boolean;
    generateAppointmentLetter: boolean;
  };

  welcome: {
    welcomewithGmail: boolean;
    welcomewithWhatsapp: boolean;
    welcomewithSlack: boolean;
  };
};

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  position: z.string().min(1, "Position is required"),
  joiningDate: z.string().min(1, "Joining date is required"),

  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  systemId: z.string().nullable().optional(),

  documents: z.object({
    generateOfferLetter: z.boolean(),
    generateAppointmentLetter: z.boolean(),
  }),

  welcome: z.object({
    welcomewithGmail: z.boolean(),
    welcomewithWhatsapp: z.boolean(),
    welcomewithSlack: z.boolean(),
  }),
});
type EmployeeFormValues = z.infer<typeof employeeSchema>;

const AddEmpForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id && id !== "new");

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      documents: {
        generateOfferLetter: false,
        generateAppointmentLetter: false,
      },
      welcome: {
        welcomewithGmail: false,
        welcomewithWhatsapp: false,
        welcomewithSlack: false,
      },
    },
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["systems"],
    queryFn: getSystems,
  });
  const systemOptions = systems.map((s: any) => ({
    value: s.id,
    label: s.name,
  }));

  const { data: employeeData } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployeeById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        position: "",
        joiningDate: "",
        departmentId: null,
        managerId: null,
        systemId: null,
        documents: {
          generateOfferLetter: false,
          generateAppointmentLetter: false,
        },
        welcome: {
          welcomewithGmail: false,
          welcomewithWhatsapp: false,
          welcomewithSlack: false,
        },
      });
      return;
    }

    if (!employeeData) return;

    reset({
      firstName: employeeData.firstName ?? "",
      lastName: employeeData.lastName ?? "",
      email: employeeData.email ?? "",
      position: employeeData.position ?? "",
      joiningDate: employeeData.joiningDate ?? "",
      departmentId: null,
      managerId: employeeData.managerId ?? null,
      systemId: employeeData.systemId ?? null,
      documents: {
        generateOfferLetter:
          employeeData.documents?.generateOfferLetter ?? false,
        generateAppointmentLetter:
          employeeData.documents?.generateAppointmentLetter ?? false,
      },
      welcome: {
        welcomewithGmail: employeeData.welcome?.welcomewithGmail ?? false,
        welcomewithWhatsapp: employeeData.welcome?.welcomewithWhatsapp ?? false,
        welcomewithSlack: employeeData.welcome?.welcomewithSlack ?? false,
      },
    });
  }, [isEditMode, employeeData, reset]);

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      toast.success(
         "Employee Added successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    },
    onError:(error : any)=>{
      toast.error(
        error?.response?.data?.message || "Fill proper value"
      );
    },

  });

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      toast.success(
         "Employee updated successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    },
    onError:(error : any)=>{
      toast.error(
        error?.response?.data?.message || "Fill proper value"
      );
    },
  });

  const onSubmit = (data: EmployeeFormValues) => {
    const payload: EmployeePayload = data;
    if (isEditMode) {
      updateMutation.mutate({ id: id!, payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const departmentOptions = [
    { value: "1", label: "HR" },
    { value: "2", label: "Engineering" },
  ];

  const managerOptions = [
    { value: "10", label: "John Manager" },
    { value: "11", label: "Jane Manager" },
  ];

  return (
    <form
      className="space-y-8 text-gray-900 dark:text-gray-100"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex items-center justify-between lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEditMode ? "Edit Employee" : "Add Employee"}
          </h2>

          <button
            type="submit"
            disabled={addMutation.isPending || updateMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {addMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : isEditMode
              ? "Update"
              : "Add"}
          </button>
        </div>

        <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="First Name"
              placeholder="Enter Firstname"
              required
              {...register("firstName")}
              error={!!errors.firstName}
              hint={errors.firstName?.message}
            />

            <Input
              label="Last Name"
              placeholder="Enter Lastname"
              required
              {...register("lastName")}
              error={!!errors.lastName}
              hint={errors.lastName?.message}
            />

            <Input
              label="Email"
              placeholder="Enter email"
              required
              {...register("email")}
              error={!!errors.email}
              hint={errors.email?.message}
            />

            <Input
              label="Position"
              placeholder="Enter position"
              required
              {...register("position")}
              error={!!errors.position}
              hint={errors.position?.message}
            />

            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Department"
                  options={departmentOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="joiningDate"
              control={control}
              rules={{ required: "Joining Date is required" }}
              render={({ field, fieldState }) => (
                <DatePicker
                  id="joiningDate"
                  label="Joining Date"
                  defaultDate={field.value}
                  onChange={(dates) =>
                    dates?.[0] &&
                    field.onChange(dates[0].toISOString().split("T")[0])
                  }
                  required
                  error={!!fieldState.error}
                  hint={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Manager"
                  options={managerOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Documents</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="documents.generateOfferLetter"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Offer Letter"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                name="documents.generateAppointmentLetter"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Appointment Letter"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">System Allocation</h2>

            <Controller
              name="systemId"
              control={control}
              render={({ field }) => (
                <Select
                  label="System"
                  options={systemOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Welcome Channels</h2>
            <div className="grid grid-cols-3 gap-4">
              <Controller
                name="welcome.welcomewithGmail"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="GMAIL"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                name="welcome.welcomewithWhatsapp"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="WHATSAPP"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                name="welcome.welcomewithSlack"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="SLACK"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddEmpForm;
