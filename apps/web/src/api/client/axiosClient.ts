import * as Sentry from "@sentry/react";
import axios, { type InternalAxiosRequestConfig } from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { tokenService } from "./tokenService";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Request Interceptor: Attach current access token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Capture server errors in Sentry
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only capture unexpected 5xx or unhandled server exceptions
    if (error.response?.status >= 500) {
      Sentry.captureException(error);
    }
    return Promise.reject(error);
  },
);

// Refresh Auth Handler
const refreshAuthLogic = async (failedRequest: any) => {
  try {
    const { accessToken } = await tokenService.refreshAccessToken();
    tokenService.setAccessToken(accessToken);

    axiosClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    if (failedRequest?.response?.config?.headers) {
      failedRequest.response.config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return Promise.resolve();
  } catch (err) {
    tokenService.clearTokens();
    if (typeof window !== "undefined" && window.location.pathname !== "/signin") {
      window.location.href = "/signin";
    }
    return Promise.reject(err);
  }
};

createAuthRefreshInterceptor(axiosClient, refreshAuthLogic);

export default axiosClient;
