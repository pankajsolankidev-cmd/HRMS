import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ExpenseSummary from "./ExpenseSummary";
import GetExpenseTable from "./ExpensePage";

export default function Expense() {
  return (
    <>
      <PageMeta title="Expenses" description="Expense list" />
      <PageBreadcrumb pageTitle="Expenses" />
      <div className="space-y-6">
        {/* <Can permission="expense.view_summary"> */}
        <ComponentCard title="Summary">
          <ExpenseSummary />
        </ComponentCard>
        <GetExpenseTable />
        {/* </Can> */}
      </div>
    </>
  );
}
