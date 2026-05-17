import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { findUserById } from "../modules/users/user.repository.js";
import { registerQueueSocketHandlers } from "./queueSocket.js";
import { setSocketServer } from "./socketHub.js";

function getSocketToken(socket) {
  const authToken = socket.handshake.auth?.accessToken || socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function getRoleNames(user) {
  return Array.isArray(user.roles)
    ? user.roles.map((role) => role?.name || role).filter(Boolean)
    : [];
}

async function authenticateSocket(socket, next) {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      next(new Error("Authentication token is required."));
      return;
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const userId = decoded.sub || decoded.id;

    if (!userId) {
      next(new Error("Invalid authentication token."));
      return;
    }

    const user = await findUserById(userId);

    if (!user) {
      next(new Error("Invalid or expired authentication token."));
      return;
    }

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      roles: getRoleNames(user)
    };

    next();
  } catch (_error) {
    next(new Error("Invalid or expired authentication token."));
  }
}

export function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    registerQueueSocketHandlers(socket);
  });

  setSocketServer(io);
  return io;
}
