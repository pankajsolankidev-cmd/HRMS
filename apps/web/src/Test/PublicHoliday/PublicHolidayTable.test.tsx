import { deletePublicHoliday } from "@/api/delete";
import {
  downloadHolidayTemplate,
  exportPublicHolidayPDF,
  getPublicHolidays,
} from "@/api/get";
import { confirmHolidayImport, previewHolidayImport } from "@/api/post";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

import PublicHolidayTable from "@/pages/PublicHoliday/PublicHolidayTable";
import toast from "react-hot-toast";

vi.mock("@/api/get", () => ({
  getPublicHolidays: vi.fn(),
  exportPublicHolidayPDF: vi.fn(),
  downloadHolidayTemplate: vi.fn(),
}));

vi.mock("@/api/delete", () => ({
  deletePublicHoliday: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  confirmHolidayImport: vi.fn(),
  previewHolidayImport: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-redux", () => ({
  useSelector: (fn: any) =>
    fn({
      auth: {
        roles: ["ADMIN"],
      },
    }),
}));

describe("PublicHolidayTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    data: [
      {
        id: 1,
        title: "Diwali",
        description: "Festival",
        fromDate: "2024-01-01",
        toDate: "2024-01-02",
      },
    ],
    meta: { total: 1 },
  };

  it("should render table data", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);

    renderWithProviders(<PublicHolidayTable />);

    await waitFor(() => {
      expect(screen.getByText("Diwali")).toBeInTheDocument();
    });
  });

  it("should navigate to add holiday", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);

    renderWithProviders(<PublicHolidayTable />);

    await userEvent.click(screen.getByText("Add Holiday"));

    expect(mockNavigate).toHaveBeenCalledWith("/holidays/new");
  });

  it("should download pdf", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);
    (exportPublicHolidayPDF as any).mockResolvedValue(new Blob());

    renderWithProviders(<PublicHolidayTable />);

    await userEvent.click(screen.getByText("Download PDF"));

    await waitFor(() => {
      expect(exportPublicHolidayPDF).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should download template", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);
    (downloadHolidayTemplate as any).mockResolvedValue(new Blob());

    renderWithProviders(<PublicHolidayTable />);

    await userEvent.click(screen.getByText("Download Template"));

    await waitFor(() => {
      expect(downloadHolidayTemplate).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should delete holiday", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);

    (deletePublicHoliday as any).mockResolvedValue({
      message: "Deleted",
    });

    renderWithProviders(<PublicHolidayTable />);

    await waitFor(() => {
      expect(screen.getByText("Diwali")).toBeInTheDocument();
    });

    const deleteBtn = document.querySelector(".text-red-600") as HTMLElement;

    await userEvent.click(deleteBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^delete$/i });

    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deletePublicHoliday).toHaveBeenCalled();
    });
  });

  it("should preview import file", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);

    (previewHolidayImport as any).mockResolvedValue({
      totalRows: 1,
      validCount: 1,
      errorCount: 0,
      validRows: [
        {
          title: "Test",
          fromDate: "2024-01-01",
          toDate: "2024-01-02",
        },
      ],
      errorRows: [],
    });

    renderWithProviders(<PublicHolidayTable />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = new File(["test"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(previewHolidayImport).toHaveBeenCalled();
      expect(screen.getByText("Import Preview")).toBeInTheDocument();
    });
  });

  it("should confirm import", async () => {
    (getPublicHolidays as any).mockResolvedValue(mockData);

    (previewHolidayImport as any).mockResolvedValue({
      totalRows: 1,
      validCount: 1,
      errorCount: 0,
      validRows: [
        {
          title: "Test",
          fromDate: "2024-01-01",
          toDate: "2024-01-02",
        },
      ],
      errorRows: [],
    });

    (confirmHolidayImport as any).mockResolvedValue({
      message: "Imported",
    });

    renderWithProviders(<PublicHolidayTable />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = new File(["test"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText("Confirm & Save")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Confirm & Save"));

    await waitFor(() => {
      expect(confirmHolidayImport).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
