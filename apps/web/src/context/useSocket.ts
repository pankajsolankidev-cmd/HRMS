import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from ".";
import { connectSocket, disconnectSocket } from "./socket";
import { registerSocketEvents } from "./socketEvents";

export const useSocket = () => {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);

    registerSocketEvents(socket);

    return () => {
      disconnectSocket();
    };
  }, [accessToken]);
};
