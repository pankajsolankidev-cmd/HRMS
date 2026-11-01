import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import * as reactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SalaryTable from "@/pages/Salary/SalaryTable";

import { deleteSalaryStructure } from "@/api/delete";
import { getSalaryStructures } from "@/api/get";
import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getSalaryStructures: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deleteSalaryStructure: vi.fn(),
}));

vi.mock("@/components/common/DeleteConfirmModal", () => ({
  default: ({ children, onConfirm }: any) =>
    children((id: any) => onConfirm(id)),
}));
const mockNavigate = vi.fn();
vi.spyOn(reactRouter, "useNavigate").mockReturnValue(mockNavigate);

const mockData = {
  data: [
    {
      salary: {
        id: "1",
        basicSalary: 10000,
        tax: 500,
        pf: 300,
        netSalary: 9200,
        description: "Test salary",
      },
      employee: {
        firstName: "John",
        lastName: "Doe",
      },
    },
  ],
  meta: { total: 1 },
};

describe("SalaryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    (getSalaryStructures as any).mockResolvedValue(mockData);
  });

  it("renders salary table data", async () => {
    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("₹ 10,000")).toBeInTheDocument();
    expect(screen.getByText("₹ 500")).toBeInTheDocument();
    expect(screen.getByText("₹ 300")).toBeInTheDocument();
    expect(screen.getByText("₹ 9,200")).toBeInTheDocument();
  });

  it("searches salary", async () => {
    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    await typeInput("Search by name", "John");

    await waitFor(() => {
      expect(getSalaryStructures).toHaveBeenCalled();
    });
  });

  it("clears search input", async () => {
    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    await typeInput("Search by name", "John");

    const clearBtn = screen.getByRole("button", { name: "" });

    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search by name")).toHaveValue("");
    });
  });

  it("navigates to add salary page", async () => {
    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    await clickButton("Add Salary");

    expect(mockNavigate).toHaveBeenCalledWith("/salary/new");
  });

  it("navigates to edit salary page", async () => {
    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    await screen.findByText("John Doe");

    const icons = document.querySelectorAll("svg");
    const editIcon = icons[icons.length - 2];

    fireEvent.click(editIcon);

    expect(mockNavigate).toHaveBeenCalledWith("/salary/1");
  });

  it("deletes salary", async () => {
    (deleteSalaryStructure as any).mockResolvedValue({
      message: "Deleted successfully",
    });

    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    await screen.findByText("John Doe");

    const icons = document.querySelectorAll("svg");
    const deleteIcon = icons[icons.length - 1];

    fireEvent.click(deleteIcon);

    await waitFor(() => {
      expect(deleteSalaryStructure).toHaveBeenCalled();
    });
  });

  it("handles API error", async () => {
    (getSalaryStructures as any).mockRejectedValue(new Error("API error"));

    renderWithProviders(
      <HelmetProvider>
        <SalaryTable />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(getSalaryStructures).toHaveBeenCalled();
    });
  });
});
