import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEditPayrollForm from "../Payroll/AddEditPayrollForm";

export default function AddEditPayroll() {
  const { id } = useParams();
  const isEditMode = Boolean(id && id!="new");

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Payroll | TailAdmin - React Dashboard"
            : "Add Payroll | TailAdmin - React Dashboard"
        }
        description={
          isEditMode ? "Edit Payroll details" : "Add a new Payroll"
        }
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit Payroll" : "Add Payroll"}>
          <AddEditPayrollForm />
        </ComponentCard>
      </div>
      </div>
  );
}
