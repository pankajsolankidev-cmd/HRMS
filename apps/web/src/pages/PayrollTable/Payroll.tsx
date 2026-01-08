import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import GetPayrollTable from "../Payroll/GetPayrollTable";

export default function Payroll() {
  const navigate = useNavigate();
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Payroll table" />
      <div className="space-y-6">
        <ComponentCard
          title="Payroll details"
          action={
            <button
              onClick={() => navigate("/payrolls/new")}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white
                 dark:bg-white dark:text-black"
            >
              Add payrolls
            </button>
          }
        >
          <GetPayrollTable />
        </ComponentCard>
      </div>
    </>
  );
}
