import * as Sentry from "@sentry/react";
import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import Cookies from "js-cookie";
import { refreshToken } from "./post";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    Sentry.captureException(error);
    return Promise.reject(error);
  },
);

api.interceptors.request.use((config) => {
  const token = Cookies.get("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const refreshAuthLogic = async (failedRequest: any) => {
  try {
    const { accessToken } = await refreshToken();
    Cookies.set("access", accessToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    failedRequest.response.config.headers["Authorization"] =
      `Bearer ${accessToken}`;
    return Promise.resolve();
  } catch (err) {
    Cookies.remove("access");
    Cookies.remove("refresh");
    window.location.href = "/signin";
    return Promise.reject(err);
  }
};

createAuthRefreshInterceptor(api, refreshAuthLogic);

export default api;
