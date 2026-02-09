import Can from "../../components/common/Can";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import GetExpenseTable from "./ExpensePage";
import ExpenseSummary from "./ExpenseSummary";

export default function Expense() {
  return (
    <>
      <PageMeta title="Expenses" description="Expense list" />
      <PageBreadcrumb pageTitle="Expenses" />
      <div className="space-y-6">
        <Can permission="expense.view_summary">
          <Card title="Summary">
            <ExpenseSummary />
          </Card>
        </Can>
        <GetExpenseTable />
      </div>
    </>
  );
}
