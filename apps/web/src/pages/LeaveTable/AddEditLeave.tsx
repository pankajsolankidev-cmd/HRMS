import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEditLeaveForm from "../Leaves/AddEditLeaveForm";

export default function AddEditLeave() {
  const { id } = useParams();
  const isEditMode = Boolean(id && id!=="new");

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Leave | TailAdmin - React Dashboard"
            : "Add Leave | TailAdmin - React Dashboard"
        }
        description={
          isEditMode ? "Edit Leave details" : "Add a new Leave"
        }
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit Leave" : "Add Leave"}>
          <AddEditLeaveForm />
        </ComponentCard>
      </div>
      </div>
  );
}
