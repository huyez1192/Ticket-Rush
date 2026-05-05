import { AppError } from "../../common/errors/AppError.js";
import { SEAT_STATUSES } from "../../common/constants/index.js";
import { findEventById, findPublicEventById } from "../events/event.repository.js";
import { mapEventToDto } from "../events/event.mapper.js";
import {
  mapPagination,
  mapSeatMapChangeToDto,
  mapSeatMapSectionToDto,
  mapSeatSectionToDto,
  mapSeatToDto
} from "./seat.mapper.js";
import {
  countSeatsBySectionId,
  createSeatSection,
  createSeats,
  deleteSeatSectionByIdForEvent,
  findAllSeatsForEvent,
  findSeatByIdForEvent,
  findSeatChanges,
  findSeatSectionByIdForEvent,
  findSeatSectionsByEventId,
  findSeatsByEventId,
  updateSeatByIdForEvent,
  updateSeatSectionByIdForEvent
} from "./seat.repository.js";

async function assertPublicEvent(eventId) {
  const event = await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return event;
}

async function assertEvent(eventId) {
  const event = await findEventById(eventId);

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

export async function createAdminSeatSection(eventId, payload) {
  await assertEvent(eventId);

  try {
    const section = await createSeatSection({
      eventId,
      name: payload.name,
      price: payload.price,
      description: payload.description
    });

    return mapSeatSectionToDto(section);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("Seat section name already exists for this event.", 409);
    }

    throw error;
  }
}

export async function updateAdminSeatSection(eventId, sectionId, payload) {
  await assertEvent(eventId);

  try {
    const section = await updateSeatSectionByIdForEvent(eventId, sectionId, payload);

    if (!section) {
      throw new AppError("Seat section not found.", 404);
    }

    return mapSeatSectionToDto(section);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("Seat section name already exists for this event.", 409);
    }

    throw error;
  }
}

export async function deleteAdminSeatSection(eventId, sectionId) {
  await assertEvent(eventId);

  const section = await findSeatSectionByIdForEvent(eventId, sectionId);

  if (!section) {
    throw new AppError("Seat section not found.", 404);
  }

  const seatCount = await countSeatsBySectionId(sectionId);

  if (seatCount > 0) {
    throw new AppError("Cannot delete a seat section that still has seats.", 409);
  }

  await deleteSeatSectionByIdForEvent(eventId, sectionId);
}

export async function generateAdminSeats(eventId, sectionId, payload) {
  await assertEvent(eventId);

  const section = await findSeatSectionByIdForEvent(eventId, sectionId);

  if (!section) {
    throw new AppError("Seat section not found.", 404);
  }

  const existingSeats = await countSeatsBySectionId(sectionId);

  if (existingSeats > 0) {
    throw new AppError("Seats have already been generated for this section.", 409);
  }

  const seats = [];

  for (let rowNumber = 1; rowNumber <= payload.rows; rowNumber += 1) {
    for (let seatNumber = 1; seatNumber <= payload.seatsPerRow; seatNumber += 1) {
      seats.push({
        eventId,
        sectionId,
        rowNumber,
        seatNumber,
        status: payload.initialStatus || SEAT_STATUSES.AVAILABLE
      });
    }
  }

  const createdSeats = await createSeats(seats);
  const populatedSeats = await findSeatsByEventId(eventId, { sectionId }, { page: 1, limit: createdSeats.length });

  return mapSeatMapSectionToDto(section, populatedSeats.items);
}

export async function updateAdminSeatStatus(eventId, seatId, payload) {
  await assertEvent(eventId);

  const seat = await updateSeatByIdForEvent(eventId, seatId, {
    status: payload.status
  });

  if (!seat) {
    throw new AppError("Seat not found.", 404);
  }

  return mapSeatToDto(seat);
}
