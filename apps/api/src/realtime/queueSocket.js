import mongoose from "mongoose";
import { ROLES } from "../common/constants/index.js";
import {
  getAdminQueueRealtimeSnapshot,
  getQueueSocketStateForUser,
  runAutoAdmissionIfNeeded
} from "../modules/waiting-queue/waitingQueue.service.js";
import {
  getQueueAdminRoom,
  getQueueEventRoom,
  getQueueUserRoom
} from "./socketHub.js";

function getEventId(payload) {
  const eventId = payload?.eventId;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    throw new Error("A valid eventId is required.");
  }

  return eventId;
}

function hasRole(socket, role) {
  return Array.isArray(socket.user?.roles) && socket.user.roles.includes(role);
}

function emitQueueError(socket, eventId, error) {
  socket.emit("queue:error", {
    eventId,
    message: error?.message || "Queue realtime update failed."
  });
}

export function registerQueueSocketHandlers(socket) {
  socket.on("queue:subscribe", async (payload = {}) => {
    let eventId = payload?.eventId;

    try {
      eventId = getEventId(payload);

      if (!hasRole(socket, ROLES.CUSTOMER)) {
        throw new Error("Customer role is required for queue updates.");
      }

      socket.join(getQueueEventRoom(eventId));
      socket.join(getQueueUserRoom(eventId, socket.user.id));

      const state = await getQueueSocketStateForUser(eventId, socket.user.id);
      socket.emit("queue:state", state);
      await runAutoAdmissionIfNeeded(eventId);
    } catch (error) {
      emitQueueError(socket, eventId, error);
    }
  });

  socket.on("queue:unsubscribe", (payload = {}) => {
    try {
      const eventId = getEventId(payload);
      socket.leave(getQueueEventRoom(eventId));
      socket.leave(getQueueUserRoom(eventId, socket.user.id));
    } catch (error) {
      emitQueueError(socket, payload?.eventId, error);
    }
  });

  socket.on("admin:queue:subscribe", async (payload = {}) => {
    let eventId = payload?.eventId;

    try {
      eventId = getEventId(payload);

      if (!hasRole(socket, ROLES.ADMIN)) {
        throw new Error("Admin role is required for admin queue updates.");
      }

      socket.join(getQueueAdminRoom(eventId));
      const snapshot = await getAdminQueueRealtimeSnapshot(eventId);
      socket.emit("admin:queue:update", {
        eventId,
        ...snapshot
      });
    } catch (error) {
      emitQueueError(socket, eventId, error);
    }
  });

  socket.on("admin:queue:unsubscribe", (payload = {}) => {
    try {
      const eventId = getEventId(payload);
      socket.leave(getQueueAdminRoom(eventId));
    } catch (error) {
      emitQueueError(socket, payload?.eventId, error);
    }
  });
}
