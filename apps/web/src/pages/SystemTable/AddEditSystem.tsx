import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEditSystemForm from "../System/AddEditSystemForm";

export default function AddEditSystem() {
  const { id } = useParams();
  const isEditMode = Boolean(id && id != "new");

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Employee | TailAdmin - React Dashboard"
            : "Add Employee | TailAdmin - React Dashboard"
        }
        description={isEditMode ? "Edit System details" : "Add a new System"}
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit System" : "Add System"}>
          <AddEditSystemForm />
        </ComponentCard>
      </div>
    </div>
  );
}
