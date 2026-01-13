import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEditSalaryForm from "../Salary/AddEditSalaryForm";

export default function AddEditSalary() {
  const { id } = useParams();
  const isEditMode = Boolean(id && id!="new");

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Salary | TailAdmin - React Dashboard"
            : "Add Salary | TailAdmin - React Dashboard"
        }
        description={
          isEditMode ? "Edit Salary details" : "Add a new Salary"
        }
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit Salary" : "Add Salary"}>
          <AddEditSalaryForm />
        </ComponentCard>
      </div>
      </div>
  );
}
