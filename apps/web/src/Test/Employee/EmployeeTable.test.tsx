import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import * as reactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EmployeeTable from "@/pages/Employee/EmployeeTable";

import { deleteEmployee } from "@/api/delete";
import { getEmployees } from "@/api/get";

import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getEmployees: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deleteEmployee: vi.fn(),
}));

vi.mock("@/components/common/DeleteConfirmModal", () => ({
  default: ({ children, onConfirm }: any) =>
    children((id: any) => onConfirm(id)),
}));

vi.mock("react-redux", () => ({
  useSelector: vi.fn(() => ({
    id: "999",
  })),
}));

const mockNavigate = vi.fn();
vi.spyOn(reactRouter, "useNavigate").mockReturnValue(mockNavigate);

const mockData = {
  data: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      position: { name: "Developer" },
      joiningDate: "2024-01-01",
      department: { name: "IT" },
      manager: { firstName: "Jane", lastName: "Smith" },
      userId: "123",
    },
  ],
  meta: { total: 1 },
};

describe("EmployeeTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    (getEmployees as any).mockResolvedValue(mockData);
  });

  it("renders employee table data", async () => {
    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@test.com")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("IT")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("searches employees", async () => {
    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    await typeInput("Search by name, email...", "John");

    await waitFor(() => {
      expect(getEmployees).toHaveBeenCalled();
    });
  });

  it("clears search input", async () => {
    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    await typeInput("Search by name, email...", "John");

    const clearBtn = screen.getByRole("button", { name: "" });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search by name, email..."),
      ).toHaveValue("");
    });
  });

  it("navigates to add employee page", async () => {
    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    await clickButton("Add Employee");

    expect(mockNavigate).toHaveBeenCalledWith("/employees/new");
  });

  it("navigates to edit employee page", async () => {
    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    await screen.findByText("John Doe");

    const icons = document.querySelectorAll("svg");
    const editIcon = icons[icons.length - 2];

    fireEvent.click(editIcon);

    expect(mockNavigate).toHaveBeenCalledWith("/employees/1");
  });

  it("deletes employee", async () => {
    (deleteEmployee as any).mockResolvedValue({
      message: "Deleted successfully",
    });

    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    await screen.findByText("John Doe");

    const icons = document.querySelectorAll("svg");
    const deleteIcon = icons[icons.length - 1];

    fireEvent.click(deleteIcon);

    await waitFor(() => {
      expect(deleteEmployee).toHaveBeenCalled();
    });
  });

  it("handles API error", async () => {
    (getEmployees as any).mockRejectedValue(new Error("API error"));

    renderWithProviders(
      <HelmetProvider>
        <EmployeeTable />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(getEmployees).toHaveBeenCalled();
    });
  });
});
