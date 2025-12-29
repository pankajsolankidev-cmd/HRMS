import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEmpForm from "../Employee/AddEditEmpForm";

export default function AddEmployee() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Employee | TailAdmin - React Dashboard"
            : "Add Employee | TailAdmin - React Dashboard"
        }
        description={
          isEditMode ? "Edit employee details" : "Add a new employee"
        }
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit Employee" : "Add Employee"}>
          <AddEmpForm />
        </ComponentCard>
      </div>
      </div>
  );
}
