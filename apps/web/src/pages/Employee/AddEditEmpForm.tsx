import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

import { getEmployeeById } from "../../api/get";
import { addEmployee } from "../../api/post";
import { updateEmployee } from "../../api/put";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import DatePicker from "../../components/form/date-picker";
import Checkbox from "../../components/form/input/Checkbox";

type AddEmployeeFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;

  department: string;
  manager: string;
  buddy: string;

  systemType: string;
  documents: string[];
  welcomeChannels: string[];
};

const AddEmpForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { control, register, handleSubmit, reset } =
    useForm<AddEmployeeFormValues>({
      defaultValues: {
        documents: ["offer_letter"],
        welcomeChannels: [],
      },
    });

  const { data: employeeData } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployeeById(id!),
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

      department: String(employeeData.departmentId ?? ""),
      manager: String(employeeData.managerId ?? ""),
      buddy: String(employeeData.buddyId ?? ""),

      systemType: employeeData.systems?.[0] ?? "",

      documents: [
        employeeData.documents?.generateOfferLetter && "offer_letter",
        employeeData.documents?.generateAppointmentLetter &&
          "appointment_letter",
      ].filter(Boolean) as string[],

      welcomeChannels: employeeData.welcome
        ? Object.keys(employeeData.welcome).filter(
            (k) => employeeData.welcome[k]
          )
        : [],
    });
  }, [employeeData, reset]);

  const toggleValue = (
    value: string,
    current: string[] = [],
    onChange: (val: string[]) => void
  ) => {
    onChange(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const addMutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      alert("Employee added successfully");
      navigate("/employees");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      alert("Employee updated successfully");
      navigate("/employees");
    },
  });

  const onSubmit = (data: AddEmployeeFormValues) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      position: data.position,
      departmentId: Number(data.department),
      joiningDate: data.joiningDate,
      managerId: Number(data.manager),
      buddyId: Number(data.buddy),

      welcome: {
        gmail: data.welcomeChannels.includes("gmail"),
        whatsapp: data.welcomeChannels.includes("whatsapp"),
        slack: data.welcomeChannels.includes("slack"),
      },

      systems: data.systemType ? [data.systemType] : [],

      documents: {
        generateOfferLetter: data.documents.includes("offer_letter"),
        generateAppointmentLetter:
          data.documents.includes("appointment_letter"),
      },
    };

    isEditMode
      ? updateMutation.mutate({ id: id!, payload })
      : addMutation.mutate(payload);
  };

  const selectClass = "bg-white dark:bg-gray-900 dark:text-gray-400 ";
    // "w-full rounded-lg border bg-white text-gray-900 border-gray-300 " +
    // "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100";

  const departmentOptions = [
    { value: "1", label: "HR" },
    { value: "2", label: "Engineering" },
    { value: "3", label: "Sales" },
  ];

  const managerOptions = [
    { value: "2", label: "John Manager" },
    { value: "3", label: "Jane Manager" },
  ];

  const buddyOptions = [
    { value: "3", label: "Alex" },
    { value: "4", label: "Sam" },
  ];

  const systemOptions = [
    { value: "Desktop", label: "Desktop" },
    { value: "Laptop", label: "Laptop" },
  ];

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
        {/* LEFT */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
            <h2 className="mb-6 text-lg font-semibold">
              Basic Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input {...register("firstName")} />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input {...register("lastName")} />
              </div>

              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input {...register("email")} />
              </div>

              <div>
                <Label>Position</Label>
                <Input {...register("position")} />
              </div>

              <div>
                <Label>Department</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={departmentOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className={selectClass}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Joining Date</Label>
                <Controller
                  name="joiningDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="joiningDate"
                      defaultDate={field.value}
                      onChange={(dates) =>
                        dates[0] &&
                        field.onChange(
                          dates[0].toISOString().split("T")[0]
                        )
                      }
                    />
                  )}
                />
              </div>

              <div>
                <Label>Manager</Label>
                <Controller
                  name="manager"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={managerOptions}
                      value={field.value}
                      onChange={field.onChange}
                      className={selectClass}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Onboarding Buddy</Label>
                <Controller
                  name="buddy"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={buddyOptions}
                      value={field.value}
                      onChange={field.onChange}
                      className={selectClass}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold">
              Document Generation
            </h2>

            <Controller
              name="documents"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2">
                  <Checkbox
                    label="Offer Letter"
                    checked={field.value.includes("offer_letter")}
                    onChange={() =>
                      toggleValue("offer_letter", field.value, field.onChange)
                    }
                  />
                  <Checkbox
                    label="Appointment Letter"
                    checked={field.value.includes("appointment_letter")}
                    onChange={() =>
                      toggleValue(
                        "appointment_letter",
                        field.value,
                        field.onChange
                      )
                    }
                  />
                </div>
              )}
            />
          </div>

          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold">
              System Allocation
            </h2>

            <Controller
              name="systemType"
              control={control}
              render={({ field }) => (
                <Select
                  options={systemOptions}
                  value={field.value}
                  onChange={field.onChange}
                  className={selectClass}
                />
              )}
            />
          </div>

          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold">
              Welcome Communication
            </h2>

            <Controller
              name="welcomeChannels"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3">
                  {["gmail", "whatsapp", "slack"].map((c) => (
                    <Checkbox
                      key={c}
                      label={c.toUpperCase()}
                      checked={field.value.includes(c)}
                      onChange={(checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, c]
                            : field.value.filter((v) => v !== c)
                        )
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





// import { useEffect } from "react";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { useForm, Controller } from "react-hook-form";
// import { useNavigate, useParams } from "react-router";

// import { getEmployeeById } from "../../api/get";
// import { addEmployee } from "../../api/post";
// import { updateEmployee } from "../../api/put";

// import Input from "../../components/form/input/InputField";
// import Select from "../../components/form/Select";
// import DatePicker from "../../components/form/date-picker";
// import Checkbox from "../../components/form/input/Checkbox";

// /* ================= CONSTANT ================= */

// const DEFAULT_SYSTEM_ID = "fea848e9-8334-404b-bafe-838d4636224f";

// /* ================= FORM TYPE ================= */

// type EmployeeFormValues = {
//   firstName: string;
//   lastName: string;
//   email: string;
//   position: string;
//   joiningDate: string;

//   departmentId?: number;
//   managerId?: string | null;
//   systemId: string;

//   welcomeChannels: string[];
//   documents: string[];
// };

// /* ================= COMPONENT ================= */

// const AddEmpForm = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const isEditMode = Boolean(id);

//   const { control, register, handleSubmit, reset } =
//     useForm<EmployeeFormValues>({
//       defaultValues: {
//         systemId: DEFAULT_SYSTEM_ID,
//         welcomeChannels: [],
//         documents: [],
//       },
//     });

//   /* ================= GET EMPLOYEE (EDIT MODE) ================= */

//   const { data: employeeData } = useQuery({
//     queryKey: ["employee", id],
//     queryFn: () => getEmployeeById(id!),
//     enabled: isEditMode,
//   });

//   useEffect(() => {
//     if (!employeeData) return;

//     reset({
//       firstName: employeeData.firstName ?? "",
//       lastName: employeeData.lastName ?? "",
//       email: employeeData.email ?? "",
//       position: employeeData.position ?? "",
//       joiningDate: employeeData.joiningDate ?? "",

//       departmentId: employeeData.departmentId ?? undefined,
//       managerId: employeeData.managerId ?? null,

//       systemId: employeeData.systemId ?? DEFAULT_SYSTEM_ID,

//       welcomeChannels: employeeData.welcome
//         ? Object.keys(employeeData.welcome).filter(
//             (k) => employeeData.welcome[k]
//           )
//         : [],

//       documents: employeeData.documents
//         ? Object.keys(employeeData.documents).filter(
//             (k) => employeeData.documents[k]
//           )
//         : [],
//     });
//   }, [employeeData, reset]);

//   /* ================= MUTATIONS ================= */

//   const addMutation = useMutation({
//     mutationFn: addEmployee,
//     onSuccess: () => {
//       alert("Employee added successfully");
//       navigate("/employees");
//     },
//   });

//   const updateMutation = useMutation({
//     mutationFn: updateEmployee,
//     onSuccess: () => {
//       alert("Employee updated successfully");
//       navigate("/employees");
//     },
//   });

//   /* ================= SUBMIT ================= */

//   const onSubmit = (data: EmployeeFormValues) => {
//     const basePayload = {
//       firstName: data.firstName,
//       lastName: data.lastName,
//       position: data.position,
//       departmentId: data.departmentId ? Number(data.departmentId) : undefined,
//       managerId: data.managerId || null,
//       systemId: data.systemId || DEFAULT_SYSTEM_ID,

//       welcomewithWhatsapp: data.welcomeChannels.includes("whatsapp"),
//       welcomewithGmail: data.welcomeChannels.includes("gmail"),
//       welcomewithSlack: data.welcomeChannels.includes("slack"),
//     };

//     if (isEditMode) {
//       updateMutation.mutate({
//         id: id!,
//         payload: basePayload,
//       });
//       return;
//     }

//     const createPayload = {
//       ...basePayload,
//       email: data.email,
//       joiningDate: data.joiningDate,
//       userId: "AUTO_FROM_AUTH",

//       welcome: {
//         whatsapp: data.welcomeChannels.includes("whatsapp"),
//         gmail: data.welcomeChannels.includes("gmail"),
//         slack: data.welcomeChannels.includes("slack"),
//       },

//       documents: {
//         generateOfferLetter: data.documents.includes("generateOfferLetter"),
//         generateAppointmentLetter: data.documents.includes(
//           "generateAppointmentLetter"
//         ),
//       },
//     };

//     addMutation.mutate(createPayload);
//   };

//   /* ================= OPTIONS ================= */

//   const departmentOptions = [
//     { value: "1", label: "HR" },
//     { value: "2", label: "Engineering" },
//     { value: "3", label: "Sales" },
//   ];

//   const managerOptions = [
//     { value: "2", label: "John Manager" },
//     { value: "3", label: "Jane Manager" },
//   ];

//   /* ================= UI ================= */

//   return (
//     <form
//       className="space-y-8 text-gray-900 dark:text-gray-100"
//       onSubmit={handleSubmit(onSubmit)}
//     >
//       <div className="flex justify-end">
//         <button
//           type="submit"
//           disabled={addMutation.isPending || updateMutation.isPending}
//           className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
//         >
//           {isEditMode ? "Update Employee" : "Add Employee"}
//         </button>
//       </div>

//       <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
//         {/* LEFT */}
//         <div className="space-y-6">
//           <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
//             <h2 className="mb-6 text-lg font-semibold">Basic Information</h2>

//             <div className="grid gap-6 md:grid-cols-2">
//               <Input label="First Name" {...register("firstName")} />
//               <Input label="Last Name" {...register("lastName")} />

//               <div className="md:col-span-2">
//                 <Input
//                   label="Email"
//                   disabled={isEditMode}
//                   {...register("email")}
//                 />
//               </div>

//               <Input label="Position" {...register("position")} />

//               <Controller
//                 name="departmentId"
//                 control={control}
//                 render={({ field }) => (
//                   <Select
//                     label="Department"
//                     options={departmentOptions}
//                     value={field.value ? String(field.value) : ""}
//                     onChange={(val) => field.onChange(Number(val))}
//                   />
//                 )}
//               />

//               <Controller
//                 name="joiningDate"
//                 control={control}
//                 render={({ field }) => (
//                   <DatePicker
//                     label="Joining Date"
//                     id="joiningDate"
//                     defaultDate={field.value}
//                     onChange={(d) =>
//                       d[0] && field.onChange(d[0].toISOString().split("T")[0])
//                     }
//                   />
//                 )}
//               />

//               <Controller
//                 name="managerId"
//                 control={control}
//                 render={({ field }) => (
//                   <Select
//                     label="Manager"
//                     options={managerOptions}
//                     value={field.value ?? ""}
//                     onChange={(val) => field.onChange(val === "" ? null : val)}
//                   />
//                 )}
//               />
//             </div>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div className="space-y-6">
//           <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
//             <h2 className="mb-4 text-lg font-semibold">System Allocation</h2>

//             <Input label="System ID" disabled {...register("systemId")} />
//           </div>

//           <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
//             <h2 className="mb-4 text-lg font-semibold">
//               Welcome Communication
//             </h2>

//             <Controller
//               name="welcomeChannels"
//               control={control}
//               render={({ field }) => (
//                 <div className="grid grid-cols-3 gap-4">
//                   {["gmail", "whatsapp", "slack"].map((c) => (
//                     <Checkbox
//                       key={c}
//                       label={c.toUpperCase()}
//                       checked={field.value.includes(c)}
//                       onChange={(checked) =>
//                         field.onChange(
//                           checked
//                             ? [...field.value, c]
//                             : field.value.filter((v) => v !== c)
//                         )
//                       }
//                     />
//                   ))}
//                 </div>
//               )}
//             />
//           </div>

//           <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
//             <h2 className="mb-4 text-lg font-semibold">Documents</h2>

//             <Controller
//               name="documents"
//               control={control}
//               render={({ field }) => (
//                 <div className="grid grid-cols-2 gap-4">
//                   <Checkbox
//                     label="Offer Letter"
//                     checked={field.value.includes("generateOfferLetter")}
//                     onChange={() =>
//                       field.onChange(
//                         field.value.includes("generateOfferLetter")
//                           ? field.value.filter(
//                               (v) => v !== "generateOfferLetter"
//                             )
//                           : [...field.value, "generateOfferLetter"]
//                       )
//                     }
//                   />
//                   <Checkbox
//                     label="Appointment Letter"
//                     checked={field.value.includes("generateAppointmentLetter")}
//                     onChange={() =>
//                       field.onChange(
//                         field.value.includes("generateAppointmentLetter")
//                           ? field.value.filter(
//                               (v) => v !== "generateAppointmentLetter"
//                             )
//                           : [...field.value, "generateAppointmentLetter"]
//                       )
//                     }
//                   />
//                 </div>
//               )}
//             />
//           </div>
//         </div>
//       </div>
//     </form>
//   );
// };

// export default AddEmpForm;
