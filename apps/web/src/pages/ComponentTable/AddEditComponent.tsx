import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEditComponentForm from "../Component/AddEditComponentForm";

export default function AddEditComponent() {
  const { id } = useParams();
  const isEditMode = Boolean(id && id !== "new");

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Component | TailAdmin - React Dashboard"
            : "Add Component | TailAdmin - React Dashboard"
        }
        description={
          isEditMode ? "Edit Component details" : "Add a new Component"
        }
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit Component" : "Add Component"}>
          <AddEditComponentForm />
        </ComponentCard>
      </div>
      </div>
  );
}
