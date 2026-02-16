import axios from "axios";
import Cookies from "js-cookie";
import { refreshToken } from "./post";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

export const refreshApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const accessToken = Cookies.get("access");

    if (
      error.response?.status === 401 &&
      accessToken &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const { accessToken: newAccessToken } = await refreshToken();

        Cookies.set("access", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (err) {
        Cookies.remove("access");
        Cookies.remove("refresh");
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
