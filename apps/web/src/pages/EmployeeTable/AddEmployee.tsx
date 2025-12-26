import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEmpForm from "../../components/Employee/AddEmpForm";

export default function AddEmployee() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  return (
    <>
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

      <div className="space-y-6">
        <ComponentCard title={isEditMode ? "Edit Employee" : "Add Employee"}>
          <AddEmpForm />
        </ComponentCard>
      </div>
    </>
  );
}
