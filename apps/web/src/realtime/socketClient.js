import { io } from "socket.io-client";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

let socket = null;
let socketToken = null;

function getSocketUrl() {
  try {
    const base = new URL(apiBaseUrl, window.location.origin);
    base.hash = "";
    base.search = "";
    base.pathname = base.pathname.replace(/\/api\/?$/, "") || "/";
    return base.toString().replace(/\/$/, "");
  } catch {
    return apiBaseUrl.replace(/\/api\/?$/, "");
  }
}

function bindHandlers(bindings, eventName, handler) {
  if (typeof handler !== "function") {
    return;
  }

  socket.on(eventName, handler);
  bindings.push([eventName, handler]);
}

export function getSocket(accessToken) {
  if (!accessToken) {
    throw new Error("An access token is required for realtime updates.");
  }

  if (socket && socketToken !== accessToken) {
    disconnectSocket();
  }

  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      auth: {
        accessToken,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    socketToken = accessToken;
  } else {
    socket.auth = { accessToken };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  socketToken = null;
}

export function subscribeToQueue(eventId, accessToken, handlers = {}) {
  if (!accessToken) {
    handlers.onError?.({ eventId, message: "Sign in again to receive queue updates." });
    return () => {};
  }

  const activeSocket = getSocket(accessToken);
  const bindings = [];
  const emitSubscribe = () => activeSocket.emit("queue:subscribe", { eventId });

  bindHandlers(bindings, "connect", () => {
    handlers.onConnect?.();
    emitSubscribe();
  });
  bindHandlers(bindings, "disconnect", (reason) => handlers.onDisconnect?.(reason));
  bindHandlers(bindings, "connect_error", (error) => handlers.onConnectError?.(error));
  bindHandlers(bindings, "queue:state", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onState?.(payload);
    }
  });
  bindHandlers(bindings, "queue:summary", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onSummary?.(payload);
    }
  });
  bindHandlers(bindings, "queue:position-updated", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onPositionUpdated?.(payload);
    }
  });
  bindHandlers(bindings, "queue:error", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onError?.(payload);
    }
  });

  if (activeSocket.connected) {
    emitSubscribe();
  }

  return () => {
    activeSocket.emit("queue:unsubscribe", { eventId });
    bindings.forEach(([eventName, handler]) => activeSocket.off(eventName, handler));
  };
}

export function subscribeToAdminQueue(eventId, accessToken, handlers = {}) {
  if (!accessToken) {
    handlers.onError?.({ eventId, message: "Sign in again to receive queue updates." });
    return () => {};
  }

  const activeSocket = getSocket(accessToken);
  const bindings = [];
  const emitSubscribe = () => activeSocket.emit("admin:queue:subscribe", { eventId });

  bindHandlers(bindings, "connect", () => {
    handlers.onConnect?.();
    emitSubscribe();
  });
  bindHandlers(bindings, "disconnect", (reason) => handlers.onDisconnect?.(reason));
  bindHandlers(bindings, "connect_error", (error) => handlers.onConnectError?.(error));
  bindHandlers(bindings, "admin:queue:update", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onUpdate?.(payload);
    }
  });
  bindHandlers(bindings, "queue:summary", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onSummary?.(payload);
    }
  });
  bindHandlers(bindings, "queue:error", (payload) => {
    if (!payload?.eventId || payload.eventId === eventId) {
      handlers.onError?.(payload);
    }
  });

  if (activeSocket.connected) {
    emitSubscribe();
  }

  return () => {
    activeSocket.emit("admin:queue:unsubscribe", { eventId });
    bindings.forEach(([eventName, handler]) => activeSocket.off(eventName, handler));
  };
}
