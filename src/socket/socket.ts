import { io } from "socket.io-client";

const URL = "https://server.stafftimetrack.com";

export const socket = io(URL, {
  autoConnect: false,
});