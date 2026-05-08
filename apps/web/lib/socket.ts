"use client";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!socket || socket.disconnected) {
    socket = io(API_URL, { transports: ["websocket"], auth: { token }, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelayMax: 5000 });
    setInterval(() => socket?.emit("heartbeat", Date.now()), 10000);
  }
  return socket;
}
