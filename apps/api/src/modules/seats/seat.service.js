import { AppError } from "../../common/errors/AppError.js";
import { SEAT_STATUSES } from "../../common/constants/index.js";
import { runWithOptionalTransaction } from "../../common/utils/runWithOptionalTransaction.js";
import { findEventById, findPublicEventById } from "../events/event.repository.js";
import { mapEventToDto } from "../events/event.mapper.js";
import {
  mapPagination,
  mapSeatMapLayoutToDto,
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
  findSeatsByIdsForEvent,
  findSeatSectionByIdForEvent,
  findSeatSectionsByEventId,
  findSeatsByEventId,
  bulkUpdateSeatLayouts as bulkUpdateSeatLayoutsRepository,
  updateSeatByIdForEvent,
  updateSeatLayout as updateSeatLayoutRepository,
  updateSeatSectionByIdForEvent
} from "./seat.repository.js";
import { findSeatMapLayoutByEventId, upsertSeatMapLayout } from "./seatMapLayout.repository.js";

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
  const [sections, seats, layout] = await Promise.all([
    findSeatSectionsByEventId(eventId),
    findAllSeatsForEvent(eventId),
    findSeatMapLayoutByEventId(eventId)
  ]);

  return {
    event: mapEventToDto(event),
    layout: mapSeatMapLayoutToDto(layout),
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
      description: payload.description,
      color: payload.color,
      displayOrder: payload.displayOrder,
      defaultSeatWidth: payload.defaultSeatWidth,
      defaultSeatHeight: payload.defaultSeatHeight
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
        status: payload.initialStatus || SEAT_STATUSES.AVAILABLE,
        layout: buildAutoLayout(payload.autoLayout, rowNumber, seatNumber)
      });
    }
  }

  const createdSeats = await createSeats(seats);
  const populatedSeats = await findSeatsByEventId(eventId, { sectionId }, { page: 1, limit: createdSeats.length });

  return mapSeatMapSectionToDto(section, populatedSeats.items);
}

export async function updateAdminSeatStatus(eventId, seatId, payload) {
  await assertEvent(eventId);

  if (payload.status === SEAT_STATUSES.SOLD) {
    throw new AppError("Seats cannot be manually marked Sold. Use the checkout/order flow to sell seats.", 400);
  }

  const seat = await updateSeatByIdForEvent(eventId, seatId, {
    status: payload.status
  });

  if (!seat) {
    throw new AppError("Seat not found.", 404);
  }

  return mapSeatToDto(seat);
}

export async function updateAdminSeatMapLayout(eventId, payload, currentUser) {
  await assertEvent(eventId);

  const layout = await upsertSeatMapLayout(eventId, payload, currentUser?.id || currentUser?._id);
  return mapSeatMapLayoutToDto(layout);
}

export async function updateAdminSeatMapStage(eventId, payload, currentUser) {
  await assertEvent(eventId);

  const existingLayout = await findSeatMapLayoutByEventId(eventId);
  const layoutPayload = {
    canvasWidth: existingLayout?.canvasWidth || 1200,
    canvasHeight: existingLayout?.canvasHeight || 800,
    gridSize: existingLayout?.gridSize || 16,
    defaultZoom: existingLayout?.defaultZoom || 1,
    viewport: existingLayout?.viewport,
    stage: payload
  };
  const layout = await upsertSeatMapLayout(eventId, layoutPayload, currentUser?.id || currentUser?._id);
  return mapSeatMapLayoutToDto(layout);
}

export async function updateAdminSeatLayout(eventId, seatId, payload) {
  await assertEvent(eventId);

  const seat = await updateSeatLayoutRepository(eventId, seatId, buildSeatLayout(payload));

  if (!seat) {
    throw new AppError("Seat not found.", 404);
  }

  return mapSeatToDto(seat);
}

export async function bulkUpdateAdminSeatLayouts(eventId, payload) {
  await assertEvent(eventId);

  const seatIds = payload.seats.map((seat) => seat.seatId);
  let updatedSeats = [];
  let updateResult = { matchedCount: 0, modifiedCount: 0 };

  await runWithOptionalTransaction(async (session) => {
    const existingSeats = await findSeatsByIdsForEvent(eventId, seatIds, session);

    if (existingSeats.length !== seatIds.length) {
      throw new AppError("One or more seats were not found for this event.", 404);
    }

    updateResult = await bulkUpdateSeatLayoutsRepository(
      eventId,
      payload.seats.map((seat) => ({
        seatId: seat.seatId,
        layout: buildSeatLayout(seat)
      })),
      session
    );

    if (updateResult.matchedCount !== seatIds.length) {
      throw new AppError("One or more seat layouts could not be updated.", 409);
    }
  });

  updatedSeats = await findSeatsByIdsForEvent(eventId, seatIds);

  return {
    updatedCount: Number(updateResult.modifiedCount || updateResult.matchedCount || 0),
    seats: updatedSeats.map((seat) => mapSeatToDto(seat)).filter(Boolean)
  };
}

function buildSeatLayout(payload = {}) {
  const layout = {
    x: payload.x,
    y: payload.y,
    rotation: payload.rotation ?? 0,
    width: payload.width,
    height: payload.height,
    label: payload.label,
    rowLabel: payload.rowLabel,
    isPlaced: payload.isPlaced
  };

  return Object.fromEntries(Object.entries(layout).filter(([, value]) => value !== undefined));
}

function buildAutoLayout(autoLayout, rowNumber, seatNumber) {
  if (!autoLayout?.enabled) {
    return undefined;
  }

  const startX = autoLayout.startX ?? 120;
  const startY = autoLayout.startY ?? 200;
  const seatGapX = autoLayout.seatGapX ?? 40;
  const seatGapY = autoLayout.seatGapY ?? 40;
  const seatWidth = autoLayout.seatWidth ?? 32;
  const seatHeight = autoLayout.seatHeight ?? 32;
  const rowLabel = getRowLabel(rowNumber);

  return {
    x: startX + (seatNumber - 1) * seatGapX,
    y: startY + (rowNumber - 1) * seatGapY,
    rotation: 0,
    width: seatWidth,
    height: seatHeight,
    label: `${rowLabel}${seatNumber}`,
    rowLabel,
    isPlaced: true
  };
}

function getRowLabel(rowNumber) {
  let value = Number(rowNumber);
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label || String(rowNumber);
}
