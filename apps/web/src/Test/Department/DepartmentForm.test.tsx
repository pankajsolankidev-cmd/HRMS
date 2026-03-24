import { getDepartmentById } from "@/api/get";
import { addDepartment } from "@/api/post";
import { updateDepartment } from "@/api/put";
import DepartmentForm from "@/pages/Department/DepartmentForm";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getDepartmentById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addDepartment: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updateDepartment: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/common/PageBreadCrumb", () => ({
  default: ({ pageTitle }: any) => <div>{pageTitle}</div>,
}));

vi.mock("@/components/common/SkeletonForm", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

const mockNavigate = vi.fn();
let mockParams: any = {};

vi.mock("react-router", async () => {
  const actual = await vi.importActual<any>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

describe("DepartmentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Add Mode", () => {
    beforeEach(() => {
      mockParams = { id: "new" };
    });

    it("renders add form", () => {
      renderWithProviders(<DepartmentForm />);

      expect(screen.getByText("Add Department")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter department name"),
      ).toBeInTheDocument();
    });

    it("validates required field", async () => {
      renderWithProviders(<DepartmentForm />);

      await clickButton("Save");

      expect(
        await screen.findByText("Department name is required"),
      ).toBeInTheDocument();
    });

    it("creates department", async () => {
      (addDepartment as any).mockResolvedValue({
        message: "Created",
      });

      renderWithProviders(<DepartmentForm />);

      await typeInput("Enter department name", "Finance");
      await clickButton("Save");

      await waitFor(() => {
        expect(addDepartment).toHaveBeenCalledWith({
          name: "Finance",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("/departments");
    });
  });

  describe("Edit Mode", () => {
    beforeEach(() => {
      mockParams = { id: "1" };

      (getDepartmentById as any).mockResolvedValue({
        name: "HR",
      });
    });

    it("renders edit form with data", async () => {
      renderWithProviders(<DepartmentForm />);

      expect(await screen.findByDisplayValue("HR")).toBeInTheDocument();
      expect(screen.getByText("Edit Department")).toBeInTheDocument();
    });

    it("updates department", async () => {
      (updateDepartment as any).mockResolvedValue({
        message: "Updated",
      });

      renderWithProviders(<DepartmentForm />);

      const input = await screen.findByDisplayValue("HR");

      await userEvent.clear(input);
      await userEvent.type(input, "HR Updated");

      await clickButton("Update");

      await waitFor(() => {
        expect(updateDepartment).toHaveBeenCalledWith("1", {
          name: "HR Updated",
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("/departments");
    });

    it("handles fetch error", async () => {
      (getDepartmentById as any).mockImplementation(() =>
        Promise.reject(new Error("Error")),
      );

      renderWithProviders(<DepartmentForm />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to load Department data",
        );
      });
    });
  });

  it("back button works", async () => {
    mockParams = { id: "new" };

    renderWithProviders(<DepartmentForm />);

    await clickButton("Back");

    expect(mockNavigate).toHaveBeenCalledWith("/departments");
  });
});
