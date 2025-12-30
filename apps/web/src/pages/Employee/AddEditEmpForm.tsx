import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

import { getEmployeeById } from "../../api/get";
import { addEmployee } from "../../api/post";
import { updateEmployee } from "../../api/put";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
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
                <Input label="First Name" {...register("firstName")} required/>
              </div>

              <div>
                <Input label="Last Name" {...register("lastName")} required/>
              </div>

              <div className="md:col-span-2">
                <Input label="Email" {...register("email")} required/>
              </div>

              <div>
                <Input label="Position" {...register("position")}  required/>
              </div>

              <div>
                <Controller
                  name="department"
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
              </div>

              <div>
                <Controller
                  name="joiningDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="JoiningDate"
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
                <Controller
                  name="manager"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Manager"
                      options={managerOptions}
                      value={field.value}
                      onChange={field.onChange}
                      className={selectClass}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <Controller
                  name="buddy"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Onboarding Buddy"
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



