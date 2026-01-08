import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import GetPayrollTable from "../Payroll/GetPayrollTable";

export default function Payroll() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Payroll table" />
      <div className="space-y-6">
        <ComponentCard title="Payroll Details">
          <GetPayrollTable />
        </ComponentCard>
      </div>
    </>
  );
}
