import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { BrowserRouter } from "react-router";

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
};

export const typeInput = async (placeholder: string, value: string) => {
  await userEvent.type(screen.getByPlaceholderText(placeholder), value);
};

export const clickButton = async (name: string) => {
  await userEvent.click(screen.getByRole("button", { name }));
};

export const mockPending = (fn: any) => {
  fn.mockImplementation(() => new Promise(() => {}));
};
