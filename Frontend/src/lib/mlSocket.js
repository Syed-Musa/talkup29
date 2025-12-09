import { io } from "socket.io-client";

// Export a lazy initializer for the ML Socket so importing this module
// doesn't throw in non-browser environments or before window exists.
const SOCKET_URL = process.env.VITE_ML_SOCKET_URL || "http://localhost:8000";

let socket = null;
const createSocket = () => {
  if (socket) return socket;
  if (typeof window === "undefined") return null;
  try {
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.debug("mlSocket connected", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.debug("mlSocket connect_error", err?.message || err);
    });
    return socket;
  } catch (e) {
    console.debug("mlSocket init error", e?.message || e);
    socket = null;
    return null;
  }
};

// default export is a function that returns the socket (initializing lazily)
export default function getMlSocket() {
  return createSocket();
}
