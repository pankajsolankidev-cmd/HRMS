import { useParams } from "react-router";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AddEditExpenseForm from "../Expense/AddEditExpenseForm";

export default function AddEditExpense() {
  const { id } = useParams();
  const isEditMode = Boolean(id && id !== "new");

  return (
    <div className="dark:bg-gray-900">
      <PageMeta
        title={
          isEditMode
            ? "Edit Expense | TailAdmin - React Dashboard"
            : "Add Expense | TailAdmin - React Dashboard"
        }
        description={isEditMode ? "Edit Expense details" : "Add a new Expense"}
      />

      <div className="space-y-6 dark:bg-gray-800">
        <ComponentCard title={isEditMode ? "Edit Expense" : "Add Expense"}>
          <AddEditExpenseForm />
        </ComponentCard>
      </div>
    </div>
  );
}
