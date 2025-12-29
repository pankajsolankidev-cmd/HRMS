import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";

import { getEmployeeById } from "../../api/get";
import { addEmployee } from "../../api/post";
import { updateEmployee } from "../../api/put";
import { useNavigate, useParams } from "react-router";
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
    if (employeeData) {
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
    }
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
          className="
            rounded-lg px-4 py-2
            bg-black text-white
            dark:bg-white dark:text-black
            disabled:opacity-50
          "
        >
          {isEditMode ? "Edit" : "Add"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6">
            <h2 className="mb-6 text-lg font-semibold">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input placeholder="first name" {...register("firstName")} />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input placeholder="last name" {...register("lastName")} />
              </div>

              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input placeholder="email@abc.com" {...register("email")} />
              </div>

              <div>
                <Label>Position</Label>
                <Input placeholder="position" {...register("position")} />
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
                        field.onChange(dates[0].toISOString().split("T")[0])
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
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Document Generation
            </h2>

            <div className="grid grid-cols-2">
              <Controller
                name="documents"
                control={control}
                render={({ field }) => (
                  <>
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
                  </>
                )}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6">
            <h2 className="mb-4 text-lg font-semibold">
              System Allocation
            </h2>
            <Label>System</Label>
            <Controller
              name="systemType"
              control={control}
              render={({ field }) => (
                <Select
                  options={systemOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Welcome Communication
            </h2>
            <Label>Welcome Message sent</Label>

            <div className="mt-5 grid grid-cols-3">
              <Controller
                name="welcomeChannels"
                control={control}
                render={({ field }) => {
                  const value: string[] = field.value ?? [];

                  return (
                    <>
                      {["gmail", "whatsapp", "slack"].map((c) => (
                        <Checkbox
                          key={c}
                          label={c.toUpperCase()}
                          checked={value.includes(c)}
                          onChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...value, c]
                                : value.filter((v) => v !== c)
                            )
                          }
                        />
                      ))}
                    </>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddEmpForm;
