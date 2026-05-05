import { AppError } from "../../common/errors/AppError.js";
import { findPublicEventById } from "../events/event.repository.js";
import { mapEventToDto } from "../events/event.mapper.js";
import {
  mapPagination,
  mapSeatMapChangeToDto,
  mapSeatMapSectionToDto,
  mapSeatSectionToDto,
  mapSeatToDto
} from "./seat.mapper.js";
import {
  findAllSeatsForEvent,
  findSeatByIdForEvent,
  findSeatChanges,
  findSeatSectionByIdForEvent,
  findSeatSectionsByEventId,
  findSeatsByEventId
} from "./seat.repository.js";

async function assertPublicEvent(eventId) {
  const event = await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return event;
}

export async function getPublicSeatSections(eventId) {
  await assertPublicEvent(eventId);

  const sections = await findSeatSectionsByEventId(eventId);

  return {
    items: sections.map((section) => mapSeatSectionToDto(section)).filter(Boolean),
    pagination: mapPagination({ page: 1, limit: sections.length || 20, total: sections.length })
  };
}

export async function getPublicSeatSectionDetail(eventId, sectionId) {
  await assertPublicEvent(eventId);

  const section = await findSeatSectionByIdForEvent(eventId, sectionId);

  if (!section) {
    throw new AppError("Seat section not found.", 404);
  }

  return mapSeatSectionToDto(section);
}

export async function getPublicSeats(eventId, query) {
  await assertPublicEvent(eventId);

  if (query.sectionId) {
    const section = await findSeatSectionByIdForEvent(eventId, query.sectionId);

    if (!section) {
      throw new AppError("Seat section not found.", 404);
    }
  }

  const pagination = {
    page: query.page,
    limit: query.limit
  };
  const { items, total } = await findSeatsByEventId(eventId, query, pagination);

  return {
    items: items.map((seat) => mapSeatToDto(seat)).filter(Boolean),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getPublicSeatDetail(eventId, seatId) {
  await assertPublicEvent(eventId);

  const seat = await findSeatByIdForEvent(eventId, seatId);

  if (!seat) {
    throw new AppError("Seat not found.", 404);
  }

  return mapSeatToDto(seat);
}

export async function getPublicSeatMap(eventId) {
  const event = await assertPublicEvent(eventId);
  const [sections, seats] = await Promise.all([findSeatSectionsByEventId(eventId), findAllSeatsForEvent(eventId)]);

  return {
    event: mapEventToDto(event),
    sections: sections.map((section) => {
      const sectionSeats = seats.filter((seat) => {
        const seatSectionId = seat.sectionId?._id?.toString?.() || seat.sectionId?.toString?.();
        return seatSectionId === section._id.toString();
      });

      return mapSeatMapSectionToDto(section, sectionSeats);
    })
  };
}

export async function getPublicSeatMapChanges(eventId, query) {
  await assertPublicEvent(eventId);

  const changes = await findSeatChanges(eventId, query.since);

  return {
    eventId,
    changes: changes.map((seat) => mapSeatMapChangeToDto(seat)).filter(Boolean),
    serverTime: new Date().toISOString()
  };
}
