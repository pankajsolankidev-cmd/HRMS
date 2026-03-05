import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import {
  getDepartments,
  getEmployeeById,
  getEmployees,
  getPositions,
  getSystems,
} from "../../api/get";
import { addEmployee } from "../../api/post";
import { updateEmployee } from "../../api/put";

import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DatePicker from "../../components/form/date-picker";
import Checkbox from "../../components/form/input/Checkbox";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  positionId: z.string().min(1, "Position is required"),
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

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
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
      firstName: "",
      lastName: "",
      email: "",
      positionId: "",
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
    },
  });

  const { data: systems } = useQuery({
    queryKey: ["systems-lookup"],
    queryFn: () => getSystems(),
  });

  const { data: positions } = useQuery({
    queryKey: ["positions-lookup"],
    queryFn: () => getPositions(),
  });
  const { data: departments } = useQuery({
    queryKey: ["departments-lookup"],
    queryFn: () => getDepartments(),
  });
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(),
  });

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployeeById(id!),
    enabled: isEditMode,
  });

  const positionOptions = (Array.isArray(positions) ? positions : []).map(
    (p: any) => ({
      value: String(p.id),
      label: p.name,
    }),
  );

  const systemOptions = (systems?.data ?? []).map((s: any) => ({
    value: String(s.id),
    label: s.name,
  }));

  const departmentOptions = (departments?.data ?? []).map((d: any) => ({
    value: String(d.id),
    label: d.name,
  }));

  const managerOptions = (employees?.data ?? []).map((e: any) => ({
    value: String(e.id),
    label: e.firstName + " " + e.lastName,
  }));

  useEffect(() => {
    if (!isEditMode || !employeeData) return;

    reset({
      firstName: employeeData.firstName ?? "",
      lastName: employeeData.lastName ?? "",
      email: employeeData.email ?? "",
      positionId: employeeData.position?.id ?? "",
      joiningDate: employeeData.joiningDate ?? "",

      departmentId: employeeData.department?.id ?? null,
      managerId: employeeData.manager?.id ?? null,
      systemId: employeeData.system?.id ?? null,

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

  const saveMutation = useMutation({
    mutationFn: (payload: EmployeeFormValues) =>
      isEditMode ? updateEmployee({ id: id!, payload }) : addEmployee(payload),
    onSuccess: (res) => {
      toast.success(
        res?.message ??
          `Employee ${isEditMode ? "updated" : "added"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Please check form values");
    },
  });

  const onSubmit = (data: EmployeeFormValues) => {
    saveMutation.mutate(data);
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading employee details...
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Employee" : "Add Employee"}
      />
      <ComponentCard>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
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

                <Controller
                  name="positionId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      required
                      placeholder="Select Position"
                      label="Position"
                      options={positionOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={!!errors.positionId}
                      hint={errors.positionId?.message}
                    />
                  )}
                />

                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      required
                      label="Department"
                      placeholder="Select Department"
                      options={departmentOptions}
                      value={field.value ?? ""}
                      onChange={(val) =>
                        field.onChange(val === "" ? null : val)
                      }
                      error={!!errors.departmentId}
                      hint={errors.departmentId?.message}
                    />
                  )}
                />

                <Controller
                  name="joiningDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      placeholder="Select date"
                      id="joiningDate"
                      label="Joining Date"
                      required
                      value={field.value ? new Date(field.value) : null}
                      onChange={(dates) => {
                        field.onChange(
                          dates?.[0]
                            ? dates[0].toLocaleDateString("en-CA")
                            : "",
                        );
                      }}
                      error={!!errors.joiningDate}
                      hint={errors.joiningDate?.message}
                    />
                  )}
                />
                {isEditMode && (
                  <Controller
                    name="managerId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Manager"
                        placeholder="Select Manager"
                        options={managerOptions}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
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

              <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
                <h2 className="mb-4 text-lg font-semibold">
                  System Allocation
                </h2>
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

              <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
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

          <div className="flex justify-end gap-3 pt-6 dark:border-gray-700">
            <Button
              disabled={saveMutation.isPending}
              className="bg-black dark:bg-blue-500 text-white"
            >
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update"
                  : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/employees")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
