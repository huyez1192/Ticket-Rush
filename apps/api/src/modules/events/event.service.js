import { AppError } from "../../common/errors/AppError.js";
import { mapEventImageToDto, mapEventToDto, mapPagination } from "./event.mapper.js";
import { findEventImages, findPublicEventById, findPublicEvents } from "./event.repository.js";

export async function getPublicEvents(query) {
  const pagination = {
    page: query.page,
    limit: query.limit
  };

  const { items, total } = await findPublicEvents(query, pagination);
  const imagesByEventId = new Map();
  const imageGroups = await Promise.all(items.map((event) => findEventImages(event._id)));

  items.forEach((event, index) => {
    imagesByEventId.set(event._id.toString(), imageGroups[index]);
  });

  return {
    items: items.map((event) => mapEventToDto(event, { images: imagesByEventId.get(event._id.toString()) || [] })),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getPublicEventDetail(eventId) {
  const event = await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const images = await findEventImages(eventId);

  return mapEventToDto(event, { images });
}

export async function getPublicEventImages(eventId) {
  const event = await findPublicEventById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const images = await findEventImages(eventId);

  return {
    items: images.map((image) => mapEventImageToDto(image)),
    pagination: mapPagination({ page: 1, limit: images.length || 20, total: images.length })
  };
}
