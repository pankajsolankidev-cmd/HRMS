import { axiosClient } from "../client/axiosClient";
import { tokenService } from "../client/tokenService";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ResetPasswordPayload,
  SignInCredentials,
  SignInResponse,
} from "../types";

export const authService = {
  signIn: async (credentials: SignInCredentials): Promise<SignInResponse> => {
    const res = await axiosClient.post<SignInResponse>(
      API_ENDPOINTS.AUTH.SIGN_IN,
      credentials,
    );
    return res.data;
  },

  logout: async (refreshToken: string) => {
    const res = await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
      refreshToken,
    });
    tokenService.clearTokens();
    return res.data;
  },

  refreshToken: async () => {
    return tokenService.refreshAccessToken();
  },

  getSession: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.AUTH.SESSION);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
    });
    return res.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const { key, newPassword } = payload;
    const res = await axiosClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      key,
      newPassword,
    });
    return res.data;
  },
};

// Aliases for compatibility
export const signInApi = authService.signIn;
export const logoutUser = authService.logout;
export const refreshToken = authService.refreshToken;
export const getSession = authService.getSession;
export const forgetPassword = authService.forgotPassword;
export const resetPassword = authService.resetPassword;
