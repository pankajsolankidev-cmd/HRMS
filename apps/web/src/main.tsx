import "./sentry";

import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "flatpickr/dist/flatpickr.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Provider as ReduxProvider } from "react-redux";
import "swiper/swiper-bundle.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { store } from "./context";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider>
            <AppWrapper>
              <Sentry.ErrorBoundary fallback={<p>Something went wrong</p>}>
                <App />
              </Sentry.ErrorBoundary>
            </AppWrapper>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
);
