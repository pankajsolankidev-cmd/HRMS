import { createSlice } from "@reduxjs/toolkit";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
  id: string | null;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  id: null,
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
      state.id = action.payload.id;
    },
    clearAuth: () => initialState,
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
