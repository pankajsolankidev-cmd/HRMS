import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.33:4000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 🔒 Optional: interceptor (future-ready)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
