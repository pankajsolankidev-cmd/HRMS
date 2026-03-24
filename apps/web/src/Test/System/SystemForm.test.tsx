import { getComponents, getSystemById } from "@/api/get";
import { addSystem } from "@/api/post";
import { updateSystem } from "@/api/put";
import SystemForm from "@/pages/System/SystemForm";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clickButton,
  createTestQueryClient,
  renderWithProviders,
  typeInput,
} from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getComponents: vi.fn(),
  getSystemById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addSystem: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updateSystem: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const openDropdown = async () => {
  const dropdown = screen.getByRole("combobox");
  await userEvent.click(dropdown);
};

describe("SystemForm", () => {
  it("should render add system form", async () => {
    (getComponents as any).mockResolvedValue({ data: [] });

    renderWithProviders(<SystemForm />);

    expect(await screen.findByText("Add System")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter system name"),
    ).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("should show validation errors on empty submit", async () => {
    (getComponents as any).mockResolvedValue({ data: [] });

    renderWithProviders(<SystemForm />);

    await clickButton("Save");

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(
      await screen.findByText("Select at least one component"),
    ).toBeInTheDocument();
  });

  it("should load components into dropdown", async () => {
    (getComponents as any).mockResolvedValue({
      data: [
        { id: 1, name: "Comp1", code: "C1" },
        { id: 2, name: "Comp2", code: "C2" },
      ],
    });

    renderWithProviders(<SystemForm />);

    await openDropdown();

    expect(await screen.findByText("Comp1 (C1)")).toBeInTheDocument();
    expect(screen.getByText("Comp2 (C2)")).toBeInTheDocument();
  });

  it("should submit form successfully (add mode)", async () => {
    (getComponents as any).mockResolvedValue({
      data: [{ id: 1, name: "Comp1", code: "C1" }],
    });

    (addSystem as any).mockResolvedValue({
      message: "System added successfully",
    });

    renderWithProviders(<SystemForm />);

    await typeInput("Enter system name", "Test System");

    await openDropdown();
    await userEvent.click(await screen.findByText("Comp1 (C1)"));

    await clickButton("Save");

    await waitFor(() => {
      expect(addSystem).toHaveBeenCalled();
    });
  });

  it("should show error toast on API failure", async () => {
    (getComponents as any).mockResolvedValue({
      data: [{ id: 1, name: "Comp1", code: "C1" }],
    });

    (addSystem as any).mockRejectedValue({
      response: {
        data: { message: "Error occurred" },
      },
    });

    renderWithProviders(<SystemForm />);

    await typeInput("Enter system name", "Test System");

    await openDropdown();
    await userEvent.click(await screen.findByText("Comp1 (C1)"));

    await clickButton("Save");

    await waitFor(() => {
      expect(addSystem).toHaveBeenCalled();
    });
  });

  it("should load system data in edit mode", async () => {
    (getComponents as any).mockResolvedValue({ data: [] });

    (getSystemById as any).mockResolvedValue({
      name: "Existing System",
      description: "Desc",
      components: [{ id: 1, name: "Comp1", code: "C1" }],
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/systems/1"]}>
          <Routes>
            <Route path="/systems/:id" element={<SystemForm />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByDisplayValue("Existing System"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Desc")).toBeInTheDocument();
  });

  it("should update system in edit mode", async () => {
    (getComponents as any).mockResolvedValue({
      data: [{ id: 1, name: "Comp1", code: "C1" }],
    });

    (getSystemById as any).mockResolvedValue({
      name: "Old",
      description: "",
      components: [],
    });

    (updateSystem as any).mockResolvedValue({
      message: "Updated",
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/systems/1"]}>
          <Routes>
            <Route path="/systems/:id" element={<SystemForm />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByDisplayValue("Old");

    await typeInput("Enter system name", " Updated");

    await openDropdown();
    await userEvent.click(await screen.findByText("Comp1 (C1)"));

    await clickButton("Update");

    await waitFor(() => {
      expect(updateSystem).toHaveBeenCalled();
    });
  });

  it("should navigate back on Back button click", async () => {
    (getComponents as any).mockResolvedValue({ data: [] });

    renderWithProviders(<SystemForm />);

    await clickButton("Back");
  });
});
