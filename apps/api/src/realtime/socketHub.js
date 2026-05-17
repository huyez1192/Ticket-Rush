let socketServer = null;

export function setSocketServer(io) {
  socketServer = io;
}

export function getSocketServer() {
  return socketServer;
}

export function hasSocketServer() {
  return Boolean(socketServer);
}

export function getQueueEventRoom(eventId) {
  return `queue:event:${eventId}`;
}

export function getQueueUserRoom(eventId, userId) {
  return `queue:user:${eventId}:${userId}`;
}

export function getQueueAdminRoom(eventId) {
  return `queue:admin:${eventId}`;
}

export function emitToQueueEvent(eventId, eventName, payload) {
  if (!socketServer) {
    return;
  }

  socketServer.to(getQueueEventRoom(eventId)).emit(eventName, payload);
}

export function emitToQueueUser(eventId, userId, eventName, payload) {
  if (!socketServer) {
    return;
  }

  socketServer.to(getQueueUserRoom(eventId, userId)).emit(eventName, payload);
}

export function emitToQueueAdmin(eventId, eventName, payload) {
  if (!socketServer) {
    return;
  }

  socketServer.to(getQueueAdminRoom(eventId)).emit(eventName, payload);
}
