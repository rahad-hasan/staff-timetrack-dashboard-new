"use client";

import { useEffect } from "react";
import { socket } from "./socket";

interface SocketProviderProps {
  children: React.ReactNode;
  token?: string;
}
export default function SocketProvider({ children, token }: SocketProviderProps) {
  useEffect(() => {

    if (token) {
      socket.auth = { token: token };

      console.log("Attempting to connect with token...");
      socket.connect();
    } else {
      console.warn("No token found, socket will not connect.");
    }

    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  return <>{children}</>;
}