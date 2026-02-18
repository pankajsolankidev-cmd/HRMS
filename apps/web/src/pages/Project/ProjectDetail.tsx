import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";

import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

import { removeEmployeeFromProject } from "../../api/delete";
import { getEmployees, getProjectEmployees } from "../../api/get";
import { assignEmployeeToProject } from "../../api/post";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [open, setOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["project-employees", id],
    queryFn: () => getProjectEmployees(id!),
    enabled: !!id,
  });
  const { data: employeeList, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(),
    enabled: open,
  });
  const { mutate: assignEmployees, isPending: assigning } = useMutation({
    mutationFn: () =>
      assignEmployeeToProject({
        projectId: id!,
        employeeIds: selectedEmployees,
      }),

    onSuccess: () => {
      toast.success("Employees assigned successfully");
      setOpen(false);
      setSelectedEmployees([]);
      refetch();
    },

    onError: () => {
      toast.error("Failed to assign employees");
    },
  });
  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId],
    );
  };

  const { mutate: removeEmployee, isPending } = useMutation({
    mutationFn: (employeeId: string) =>
      removeEmployeeFromProject({ projectId: id!, employeeId }),
    onSuccess: () => {
      toast.success("Employee removed from project");
      refetch();
    },
    onError: () => {
      toast.error("Failed to remove employee");
    },
  });

  const employees: Employee[] = data?.data ?? [];
  const assignedEmployeeIds = employees.map((emp) => emp.id);

  const columns: Column<Employee>[] = [
    {
      header: "Name",
      accessor: "firstName",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.firstName ?? "-"} {row.lastName ?? "-"}
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.email ?? "-"}
        </div>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <DeleteConfirm<string>
          title="Remove Team Member"
          description="Are you sure you want to remove this employee from the project?"
          loading={isPending}
          onConfirm={(id) => removeEmployee(id)}
        >
          {(askDelete) => (
            <IconTrash
              size={18}
              onClick={() => askDelete(row.id)}
              className="cursor-pointer text-red-600 dark:text-red-400"
            />
          )}
        </DeleteConfirm>
      ),
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Project Team Members" />

      <Card
        action={
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setSelectedEmployees(assignedEmployeeIds);
                setOpen(true);
              }}
              size="md"
              className="bg-black dark:bg-blue-500"
            >
              Add Team Member
            </Button>
            <Button variant="outline" onClick={() => navigate("/projects")}>
              Back
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={employees}
          isLoading={isLoading}
          isError={false}
          page={page}
          limit={limit}
          total={employees.length}
          onPageChange={setPage}
          onLimitChange={() => {}}
        />
      </Card>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 w-[600px] rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Select Team Members</h2>

            <div className="max-h-60 overflow-y-auto space-y-3">
              {loadingEmployees ? (
                <p>Loading...</p>
              ) : (
                employeeList?.data?.map((emp: any) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button
                onClick={() => assignEmployees()}
                disabled={assigning || selectedEmployees.length === 0}
                className="bg-blue-600 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
