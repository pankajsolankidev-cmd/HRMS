import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import GetempDetail from "../../components/Employee/GetEmpDetail";

export default function Employee() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {/* <PageBreadcrumb pageTitle="Basic Tables" /> */}
      <div className="space-y-6">
        <ComponentCard title="Employee Details">
          <GetempDetail />
        </ComponentCard>
      </div>
    </>
  );
}
