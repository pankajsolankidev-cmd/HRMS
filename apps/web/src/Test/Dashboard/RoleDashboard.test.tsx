import RoleDashboard from "@/pages/Dashboard/RoleDashboard";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

vi.mock("@/pages/Dashboard/AdminDashboard", () => ({
  default: () => <div>Admin Dashboard</div>,
}));

vi.mock("@/pages/Dashboard/EmployeeDashboard", () => ({
  default: () => <div>Employee Dashboard</div>,
}));

const createMockStore = (roles: string[]) =>
  configureStore({
    reducer: {
      auth: () => ({
        roles,
        user: null,
        token: null,
        isAuthenticated: true,
      }),
    },
  });

const renderWithRedux = (roles: string[]) => {
  const store = createMockStore(roles);

  return renderWithProviders(
    <Provider store={store}>
      <RoleDashboard />
    </Provider>,
  );
};

describe("RoleDashboard", () => {
  it("renders employee dashboard", async () => {
    renderWithRedux(["EMPLOYEE"]);
    expect(await screen.findByText("Employee Dashboard")).toBeInTheDocument();
  });

  it("renders admin dashboard", async () => {
    renderWithRedux(["ADMIN"]);
    expect(await screen.findByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("renders HR dashboard", async () => {
    renderWithRedux(["HR"]);
    expect(await screen.findByText("Admin Dashboard")).toBeInTheDocument();
  });
});
