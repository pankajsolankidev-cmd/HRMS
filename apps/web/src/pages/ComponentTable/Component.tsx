import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import GetComponentTable from "../Component/GetComponentTable";

export default function Employee() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Component table" />
      <div className="space-y-6">
        <ComponentCard title="Component Details">
          <GetComponentTable />
        </ComponentCard>
      </div>
    </>
  );
}
