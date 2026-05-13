export const SEAT_SHAPES = Object.freeze({
  SQUARE: "Square",
  CIRCLE: "Circle",
  ROUNDED_SQUARE: "RoundedSquare",
  DIAMOND: "Diamond",
  HEXAGON: "Hexagon",
  PILL: "Pill",
});

export const SEAT_SHAPE_OPTIONS = Object.freeze([
  {
    value: SEAT_SHAPES.SQUARE,
    label: "Square",
    className: "seat-shape--square",
    description: "Default compact seat block.",
  },
  {
    value: SEAT_SHAPES.CIRCLE,
    label: "Circle",
    className: "seat-shape--circle",
    description: "Round seat marker.",
  },
  {
    value: SEAT_SHAPES.ROUNDED_SQUARE,
    label: "Rounded square",
    className: "seat-shape--rounded-square",
    description: "Softer square marker.",
  },
  {
    value: SEAT_SHAPES.DIAMOND,
    label: "Diamond",
    className: "seat-shape--diamond",
    description: "Rotated marker for distinct sections.",
  },
  {
    value: SEAT_SHAPES.HEXAGON,
    label: "Hexagon",
    className: "seat-shape--hexagon",
    description: "Angular section marker.",
  },
  {
    value: SEAT_SHAPES.PILL,
    label: "Pill",
    className: "seat-shape--pill",
    description: "Wide rounded marker.",
  },
]);

const SEAT_SHAPE_VALUES = new Set(SEAT_SHAPE_OPTIONS.map((shape) => shape.value));
const SEAT_SHAPE_BY_VALUE = new Map(SEAT_SHAPE_OPTIONS.map((shape) => [shape.value, shape]));

export function normalizeSeatShape(value) {
  return SEAT_SHAPE_VALUES.has(value) ? value : SEAT_SHAPES.SQUARE;
}

export function getSeatShapeMeta(value) {
  return SEAT_SHAPE_BY_VALUE.get(normalizeSeatShape(value)) || SEAT_SHAPE_BY_VALUE.get(SEAT_SHAPES.SQUARE);
}

export function getSeatShapeClassName(value) {
  return getSeatShapeMeta(value).className;
}
