import axios from "axios";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "../endpoints";

export const TOKEN_KEYS = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export const tokenService = {
  getAccessToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEYS.ACCESS);
  },

  getRefreshToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEYS.REFRESH);
  },

  setAccessToken: (token: string): void => {
    Cookies.set(TOKEN_KEYS.ACCESS, token);
  },

  setTokens: (accessToken: string, refreshToken?: string): void => {
    Cookies.set(TOKEN_KEYS.ACCESS, accessToken);
    if (refreshToken) {
      Cookies.set(TOKEN_KEYS.REFRESH, refreshToken);
    }
  },

  clearTokens: (): void => {
    Cookies.remove(TOKEN_KEYS.ACCESS);
    Cookies.remove(TOKEN_KEYS.REFRESH);
  },

  /**
   * Refreshes the access token using a standalone HTTP call to avoid circular dependency
   * with the interceptor-configured Axios client.
   */
  refreshAccessToken: async (): Promise<{ accessToken: string }> => {
    const refreshToken = Cookies.get(TOKEN_KEYS.REFRESH);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL || "";
    const response = await axios.post<{ accessToken: string }>(
      `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
      { refreshToken },
      { withCredentials: true },
    );

    return response.data;
  },
};
