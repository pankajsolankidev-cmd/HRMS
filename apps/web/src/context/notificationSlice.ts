import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Notification = {
  id: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
};

type NotificationState = {
  items: Notification[];
  unreadCount: number;
};

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAllRead } = notificationSlice.actions;

export default notificationSlice.reducer;
