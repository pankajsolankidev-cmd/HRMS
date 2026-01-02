import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router";

import { getEmployeeById, getSystems } from "../../api/get";
import { addEmployee } from "../../api/post";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import Checkbox from "../../components/form/input/Checkbox";
import { updateEmployee } from "../../api/put";

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
/* ---------------- ZOD SCHEMA ---------------- */
const addEmployeeSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  position: z.string().min(1, "Required"),
  joiningDate: z.string().min(1, "Required"),

  // :white_check_mark: UUID string or null
  department: z.string().nullable().optional(),
  manager: z.string().nullable().optional(),
  systemType: z.string().nullable().optional(),

  documents: z.object({
    generateOfferLetter: z.boolean(),
    generateAppointmentLetter: z.boolean(),
  }),

  welcome: z.object({
    gmail: z.boolean(),
    whatsapp: z.boolean(),
    slack: z.boolean(),
  }),
});

type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;
type WelcomeKey = "gmail" | "whatsapp" | "slack";

/* ---------------- COMPONENT ---------------- */
const AddEmpForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id && id !== "new");

  const { control, register, handleSubmit, reset } =
    useForm<AddEmployeeFormValues>({
      resolver: zodResolver(addEmployeeSchema),
      defaultValues: {
        department: null,
        manager: null,
        systemType: null,
        documents: {
          generateOfferLetter: false,
          generateAppointmentLetter: false,
        },
        welcome: {
          gmail: false,
          whatsapp: false,
          slack: false,
        },
      },
    });

  /* ---------------- FETCH EMPLOYEE ---------------- */
  const { data: employeeData } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const res = await getEmployeeById(id!);
      console.log("EMPLOYEE API RESPONSE =>", res);
      return res;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!employeeData) return;
    reset({
      firstName: employeeData.firstName ?? "",
      lastName: employeeData.lastName ?? "",
      email: employeeData.email ?? "",
      position: employeeData.position ?? "",
      joiningDate: employeeData.joiningDate ?? "",

      department: employeeData.departmentId ?? null,
      manager: employeeData.managerId ?? null,
      systemType: employeeData.systemId ?? null,

      documents: {
        generateOfferLetter: !!employeeData.documents?.generateOfferLetter,
        generateAppointmentLetter:
          !!employeeData.documents?.generateAppointmentLetter,
      },

      welcome: {
        gmail: !!employeeData.welcomewithGmail,
        whatsapp: !!employeeData.welcomewithWhatsapp,
        slack: !!employeeData.welcomewithSlack,
      },
    });
  }, [employeeData, reset]);

  /* ---------------- FETCH SYSTEMS ---------------- */
  const { data: systems = [] } = useQuery({
    queryKey: ["systems"],
    queryFn: getSystems,
  });

  const systemOptions = [
    { value: "", label: "None" },
    ...systems.map((s: any) => ({
      value: s.id, // UUID string
      label: s.name,
    })),
  ];

  /* ---------------- MUTATIONS ---------------- */
  const addMutation = useMutation({
    mutationFn: (payload: EmployeePayload) => addEmployee(payload),
    onSuccess: () => navigate("/employees"),
    onError: (e: any) =>
      console.error("ADD EMPLOYEE ERROR:", e?.response?.data || e),
  });

  const updateMutation = useMutation({
  mutationFn: ({ id, payload }: { id: string; payload: any }) =>
    updateEmployee({ id, payload }),
  onSuccess: () => {
    console.log("✅ EMPLOYEE UPDATED SUCCESSFULLY");
    navigate("/employees");
  },
  onError: (error: any) => {
    console.error("❌ UPDATE FAILED");
    console.error("STATUS:", error?.response?.status);
    console.error("MESSAGE:", error?.response?.data);
  },
});

  /* ---------------- SUBMIT ---------------- */
 const onSubmit = (data: AddEmployeeFormValues) => {
  console.log("SUBMIT FIRED");
  if (isEditMode) {
    // ✅ EDIT PAYLOAD (ONLY editable fields)
    const updatePayload = {
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,

      departmentId: data.department || null,
      managerId: data.manager || null,
      systemId: data.systemType || null,

      // ✅ SAME BACKEND FORMAT
      welcome: {
        welcomewithGmail: data.welcome.gmail,
        welcomewithWhatsapp: data.welcome.whatsapp,
        welcomewithSlack: data.welcome.slack,
      },
    };

    console.log("EDIT PAYLOAD =>", updatePayload);

    updateMutation.mutate({
      id: id!,
      payload: updatePayload as any, // backend update accepts partial
    });
  } else {
    // ✅ ADD PAYLOAD (FULL)
    const createPayload: EmployeePayload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      position: data.position,
      joiningDate: data.joiningDate,

      departmentId: data.department || null,
      managerId: data.manager || null,
      systemId: data.systemType || null,

      documents: data.documents,

      welcome: {
        welcomewithGmail: data.welcome.gmail,
        welcomewithWhatsapp: data.welcome.whatsapp,
        welcomewithSlack: data.welcome.slack,
      },
    };

    console.log("ADD PAYLOAD =>", createPayload);

    addMutation.mutate(createPayload);
  }
};



  /* ---------------- UI ---------------- */
    return (
      <form
        className="space-y-8 text-gray-900 dark:text-gray-100"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addMutation.isPending || updateMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {isEditMode ? "Edit" : "Add"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ---------------- LEFT ---------------- */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
              <h2 className="mb-6 text-lg font-semibold">Basic Information</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <Input label="First Name" {...register("firstName")} />
                <Input label="Last Name" {...register("lastName")} />

                <div className="md:col-span-2">
                  <Input label="Email" {...register("email")} />
                </div>

                <Input label="Position" {...register("position")} />

                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Department"
                      options={[]} // keep your existing options source
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v || null)}
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

                <Controller
                  name="manager"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Manager"
                      options={[]} // keep your existing options source
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v || null)}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* ---------------- RIGHT ---------------- */}
          <div className="space-y-6">
            
            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
              <h2 className="mb-4 text-lg font-semibold">Document Generation</h2>
                  
              <Controller
                name="documents"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2">
                    <Checkbox
                      label="Offer Letter"
                      checked={field.value.generateOfferLetter}
                      onChange={(checked) =>
                        field.onChange({
                          ...field.value,
                          generateOfferLetter: checked,
                        })
                      }
                    />
                    <Checkbox
                      label="Appointment Letter"
                      checked={field.value.generateAppointmentLetter}
                      onChange={(checked) =>
                        field.onChange({
                          ...field.value,
                          generateAppointmentLetter: checked,
                        })
                      }
                    />
                  </div>
                )}
              />
            </div>

            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
              <h2 className="mb-4 text-lg font-semibold">System Allocation</h2>

              <Controller
                name="systemType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={systemOptions}
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v || null)}
                  />
                )}
              />
            </div>

            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
              <h2 className="mb-4 text-lg font-semibold">
                Welcome Communication
              </h2>

              <Controller
                name="welcome"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3">
                    {(["gmail", "whatsapp", "slack"] as WelcomeKey[]).map((k) => (
                      <Checkbox
                        key={k}
                        label={k.toUpperCase()}
                        checked={field.value[k]}
                        onChange={(checked) =>
                          field.onChange({
                            ...field.value,
                            [k]: checked,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    );
};

export default AddEmpForm;