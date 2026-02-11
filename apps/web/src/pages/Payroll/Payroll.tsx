import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PayrollPage from "./PayrollPage";
import PayrollSummary from "./PayrollSummary";

export default function Payroll() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Payroll" />
      <div className="space-y-6">
        {/* <Can permission="payroll.view_summary"> */}
        <Card title="Summary">
          <PayrollSummary />
        </Card>
        {/* </Can> */}
        <PayrollPage />
      </div>
    </>
  );
}
