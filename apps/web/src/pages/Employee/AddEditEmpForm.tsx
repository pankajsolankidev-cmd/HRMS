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
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
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

  const selectClass = "bg-white dark:bg-gray-900 dark:text-gray-400";

  return (
    <form
      className="space-y-8 text-gray-900 dark:text-gray-100"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={addMutation.isPending || updateMutation.isPending}
          className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          {isEditMode ? "Update" : "Add"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
          <h2 className="mb-6 text-lg font-semibold">Basic Information</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Input label="First Name" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}

            <Input label="Last Name" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName.message}</p>
            )}

            <Input label="Email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}

            <Input label="Position" {...register("position")} />
            {errors.position && (
              <p className="text-sm text-red-500">{errors.position.message}</p>
            )}

            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Department"
                  options={departmentOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className={selectClass}
                />
              )}
            />

            <Controller
              name="joiningDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Joining Date"
                  id="joiningDate"
                  defaultDate={field.value}
                  onChange={(dates) =>
                    dates[0] &&
                    field.onChange(dates[0].toISOString().split("T")[0])
                  }
                />
              )}
            />
            {errors.joiningDate && (
              <p className="text-sm text-red-500">
                {errors.joiningDate.message}
              </p>
            )}

            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Manager"
                  options={managerOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className={selectClass}
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
                  className={selectClass}
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