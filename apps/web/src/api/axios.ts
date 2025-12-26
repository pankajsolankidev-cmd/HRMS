import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.33:4000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
