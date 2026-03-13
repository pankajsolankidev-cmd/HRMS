import Card from "@/components/common/Card";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "@/components/tables/BasicTables/DataTable";
import Button from "@/components/ui/button/Button";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router";

import { removeEmployeeFromProject } from "@/api/delete";
import { getEmployees, getProjectEmployees } from "@/api/get";
import { assignEmployeeToProject } from "@/api/post";
import DeleteConfirm from "@/components/common/DeleteConfirmModal";
import Checkbox from "@/components/form/input/Checkbox";
import type { AxiosError } from "axios";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [open, setOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const projectStatus = location.state?.status;
  const isCompleted = projectStatus === "COMPLETED";

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

    onSuccess: (res) => {
      toast.success(res?.message ?? "Employees assigned successfully");
      setOpen(false);
      setSelectedEmployees([]);
      refetch();
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "Failed to assign employees",
      );
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
    onSuccess: (res) => {
      toast.success(res?.message ?? "Employee removed from project");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
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
      cell: (row) =>
        !isCompleted ? (
          <DeleteConfirm<string>
            title="Remove Team Member"
            description="Are you sure you want to remove this employee from the project?"
            loading={isPending}
            onConfirm={(id) => removeEmployee(id)}
          >
            {(onDelete) => (
              <IconTrash
                size={18}
                onClick={() => onDelete(row.id)}
                className="cursor-pointer text-red-600 dark:text-red-400"
              />
            )}
          </DeleteConfirm>
        ) : null,
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Project Team Members" />

      <Card
        action={
          <div className="flex items-center gap-3">
            {!isCompleted && (
              <Button
                onClick={() => {
                  setSelectedEmployees(assignedEmployeeIds);
                  setOpen(true);
                }}
                size="md"
              >
                Add Team Member
              </Button>
            )}

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[500px] max-w-full rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold">Select Team Members</h2>

            <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
              {loadingEmployees ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : (
                employeeList?.data?.map((emp: any) => (
                  <Checkbox
                    key={emp.id}
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    label={`${emp.firstName} ${emp.lastName}`}
                    className="w-full rounded-md border p-2"
                  />
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button
                size="md"
                onClick={assignEmployees}
                disabled={assigning || selectedEmployees.length === 0}
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
