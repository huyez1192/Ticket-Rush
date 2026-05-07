import { EventSeatMapLayout } from "./eventSeatMapLayout.model.js";

export function findSeatMapLayoutByEventId(eventId, session) {
  return EventSeatMapLayout.findOne({ eventId }).session(session || null).lean();
}

export function upsertSeatMapLayout(eventId, payload, userId, session) {
  const update = {
    ...payload,
    eventId,
    updatedBy: userId || null
  };

  return EventSeatMapLayout.findOneAndUpdate(
    { eventId },
    {
      $set: update,
      $inc: { version: 1 }
    },
    { new: true, upsert: true, runValidators: true }
  )
    .session(session || null)
    .lean();
}
