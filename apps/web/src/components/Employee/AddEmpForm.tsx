import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { addEmployee } from "../../api/post";
import { useNavigate } from "react-router";

const AddEmpForm = () => {
  /* ================= BASIC FIELDS ================= */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  /* ================= IDS ================= */
  const [department, setDepartment] = useState("");
  const [manager, setManager] = useState("");
  const [buddy, setBuddy] = useState("");

  /* ================= SYSTEMS ================= */
  const [systemType, setSystemType] = useState("");

  /* ================= CHECKBOX STATES ================= */
  const [documents, setDocuments] = useState<string[]>(["offer_letter"]);
  const [welcomeChannels, setWelcomeChannels] = useState<string[]>([]);

  /* ================= HELPERS ================= */
  const toggleValue = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  /* ================= MUTATION ================= */
  const { mutate: createEmployee, isPending } = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      alert("Employee added successfully");
      resetForm();                  // ✅ clear all state
    navigate("/employees"); 
    },
    onError: () => {
      alert("Failed to add employee");
    },
  });
  const navigate = useNavigate();

const resetForm = () => {
  setFirstName("");
  setLastName("");
  setEmail("");
  setPosition("");
  setJoiningDate("");

  setDepartment("");
  setManager("");
  setBuddy("");
  setSystemType("");

  setDocuments([]);
  setWelcomeChannels([]);
};


  /* ================= SUBMIT ================= */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      firstName,
      lastName,
      email,
      position,
      departmentId: Number(department),
      joiningDate,
      managerId: Number(manager),
      buddyId: Number(buddy),

      welcome: {
        gmail: welcomeChannels.includes("gmail"),
        whatsapp: welcomeChannels.includes("whatsapp"),
        slack: welcomeChannels.includes("slack"),
      },

      systems: systemType ? [systemType] : [],

      documents: {
        generateOfferLetter: documents.includes("offer_letter"),
        generateAppointmentLetter: documents.includes("appointment_letter"),
      },
    };

    console.log("FINAL PAYLOAD 👉", payload);
    createEmployee(payload);
  };

  /* ================= OPTIONS ================= */
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
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* HEADER */}
      <div className="flex justify-end ">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold">Basic Information</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input
                  placeholder="first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input
                placeholder="last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input
                  placeholder="email@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Position</Label>
                <Input
                placeholder="Software developer"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>

              <div>
                <Label>Department</Label>
                <Select options={departmentOptions} onChange={setDepartment} />
              </div>

              <div>
                {" "}
                <Label>Joining Date</Label>{" "}
                <DatePicker
                  id="joiningDate"
                  placeholder="dd-mm-yyyy"
                  onChange={(dates) => {
                    if (dates.length > 0) {
                      setJoiningDate(dates[0].toISOString().split("T")[0]);
                    }
                  }}
                />{" "}
              </div>

              <div>
                <Label>Manager</Label>
                <Select options={managerOptions} onChange={setManager} />
              </div>

              <div className="md:col-span-2">
                <Label>Onboarding Buddy</Label>
                <Select options={buddyOptions} onChange={setBuddy} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Document Generation</h2>
            <div className="grid grid-cols-2">
            <Checkbox
              label="Offer Letter"
              checked={documents.includes("offer_letter")}
              onChange={() => toggleValue("offer_letter", setDocuments)}
            />
            <Checkbox
              label="Appointment Letter"
              checked={documents.includes("appointment_letter")}
              onChange={() => toggleValue("appointment_letter", setDocuments)}
            />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">System Allocation</h2>
            <Label>System</Label>
            <Select options={systemOptions} onChange={setSystemType} />
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Welcome Communication
            </h2>
            <Label>Welcome Message sent</Label>
            <div className="mt-5 grid grid-cols-3">
            {["gmail", "whatsapp", "slack"].map((c) => (
              <Checkbox
                key={c}
                label={c.toUpperCase()}
                checked={welcomeChannels.includes(c)}
                onChange={() => toggleValue(c, setWelcomeChannels)}
              />
            ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddEmpForm;
