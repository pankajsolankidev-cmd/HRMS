import { useState } from "react";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BulkPayrollSelected from "./BulkPayrollSelected";
import PayrollPage from "./PayrollPage";
import PayrollSummary from "./PayrollSummary";

export default function Payroll() {
  const [bulkEmployees, setBulkEmployees] = useState<any[]>([]);

  return (
    <>
      <PageBreadcrumb pageTitle="Payroll" />

      <div className="space-y-6">
        <Card title="Summary">
          <PayrollSummary />
        </Card>

        {bulkEmployees.length > 0 && (
          <Card title="Bulk Payroll">
            <BulkPayrollSelected
              employees={bulkEmployees}
              onClear={() => setBulkEmployees([])}
              onUpdate={setBulkEmployees}
            />
          </Card>
        )}

        <PayrollPage setBulkEmployees={setBulkEmployees} />
      </div>
    </>
  );
}
