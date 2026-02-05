import { createSlice } from "@reduxjs/toolkit";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  roles: [],
  permissions: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.roles = action.payload.roles;
      state.permissions = action.payload.permissions;
    },

    clearAuth: () => initialState,
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
