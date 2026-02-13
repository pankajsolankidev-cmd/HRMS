import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BulkPayrollPage from "./BulkPayrollPage";
import PayrollSummary from "./PayrollSummary";

export default function Payroll() {
  return (
    <>
      <PageBreadcrumb pageTitle="Payroll" />

      <div className="space-y-6">
        <Card title="Summary">
          <PayrollSummary />
        </Card>
        <BulkPayrollPage />
      </div>
    </>
  );
}
