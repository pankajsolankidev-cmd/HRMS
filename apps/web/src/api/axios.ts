import axios from "axios";
import Cookies from "js-cookie";
import { refreshToken } from "./post";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* ================= REQUEST ================= */
api.interceptors.request.use((config) => {
  const token = Cookies.get("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= RESPONSE ================= */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { accessToken } = await refreshToken();

        Cookies.set("access", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch {
        Cookies.remove("access");
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  }
);

export default api;


// // api/axios.ts
// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://192.168.1.35:4000",
//   withCredentials: true,
// });
// api.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

// export default api;

