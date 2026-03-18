import { getComponentById } from "@/api/get";
import { addComponent } from "@/api/post";
import { updateComponent } from "@/api/put";
import ComponentForm from "@/pages/Component/ComponentForm";
import { screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clickButton, renderWithProviders, typeInput } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getComponentById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addComponent: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updateComponent: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

let mockId = "new";
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ id: mockId }),
    useNavigate: () => mockNavigate,
  };
});

describe("ComponentForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockId = "new";
  });

  it("renders Add Component page correctly", () => {
    renderWithProviders(<ComponentForm />);

    expect(screen.getByText("Add Component")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders Edit Component page", async () => {
    mockId = "123";

    (getComponentById as any).mockResolvedValue({
      name: "Test",
      code: "123",
      description: "desc",
    });

    renderWithProviders(<ComponentForm />);

    expect(await screen.findByText("Edit Component")).toBeInTheDocument();
    expect(await screen.findByText("Update")).toBeInTheDocument();
  });

  it("prefills form data in edit mode", async () => {
    mockId = "123";

    (getComponentById as any).mockResolvedValue({
      name: "Prefill Name",
      code: "CODE123",
      description: "desc",
    });

    renderWithProviders(<ComponentForm />);

    expect(await screen.findByDisplayValue("Prefill Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CODE123")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    renderWithProviders(<ComponentForm />);

    await clickButton("Save");

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Code is required")).toBeInTheDocument();
    });
  });

  it("calls addComponent on submit", async () => {
    (addComponent as any).mockResolvedValue({ message: "Success" });

    renderWithProviders(<ComponentForm />);

    await typeInput("Enter component name", "Test");
    await typeInput("Enter component code", "123");

    await clickButton("Save");

    await waitFor(() => {
      expect(addComponent).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/components");
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("calls updateComponent in edit mode", async () => {
    mockId = "123";

    (getComponentById as any).mockResolvedValue({
      name: "Old",
      code: "111",
      description: "",
    });

    (updateComponent as any).mockResolvedValue({ message: "Updated" });

    renderWithProviders(<ComponentForm />);

    await screen.findByDisplayValue("Old");

    await clickButton("Update");

    await waitFor(() => {
      expect(updateComponent).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/components");
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("handles API error on submit", async () => {
    (addComponent as any).mockRejectedValue({
      response: {
        data: { message: "Error occurred" },
      },
    });

    renderWithProviders(<ComponentForm />);

    await typeInput("Enter component name", "Test");
    await typeInput("Enter component code", "123");

    await clickButton("Save");

    await waitFor(() => {
      expect(addComponent).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Error occurred");
    });
  });

  it("navigates back when clicking Back button", async () => {
    renderWithProviders(<ComponentForm />);

    await clickButton("Back");

    expect(mockNavigate).toHaveBeenCalledWith("/components");
  });
});
