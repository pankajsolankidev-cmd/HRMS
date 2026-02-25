import toast from "react-hot-toast";
import { store } from ".";
import { addNotification } from "../context/notificationSlice";

export const registerSocketEvents = (socket: any) => {
  if (!socket) return;

  socket.off("new_notification");

  socket.on("connect", () => {
    console.log("✅ Socket Connected:", socket.id);
  });

  socket.on("new_notification", (data: any) => {
    console.log("🔔 Notification received:", data);
    toast.success(data.message);

    store.dispatch(
      addNotification({
        id: crypto.randomUUID(),
        message: data.message,
        type: "INFO",
        createdAt: new Date().toISOString(),
        read: false,
      }),
    );
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected");
  });
};
