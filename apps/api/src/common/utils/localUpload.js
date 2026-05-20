import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AppError } from "../errors/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, "../../..");

export const UPLOAD_ROOT = path.join(apiRoot, "uploads");
export const UPLOAD_SUBDIRECTORIES = Object.freeze({
  AVATARS: "avatars",
  EVENT_IMAGES: "event-images"
});

const uploadDirectories = Object.freeze({
  [UPLOAD_SUBDIRECTORIES.AVATARS]: path.join(UPLOAD_ROOT, UPLOAD_SUBDIRECTORIES.AVATARS),
  [UPLOAD_SUBDIRECTORIES.EVENT_IMAGES]: path.join(UPLOAD_ROOT, UPLOAD_SUBDIRECTORIES.EVENT_IMAGES)
});

export const ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const MIME_TYPE_EXTENSIONS = Object.freeze({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
});

export function ensureUploadDirectories() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

  for (const directory of Object.values(uploadDirectories)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

export function getRequestBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

export function buildPublicUploadUrl(baseUrl, publicPath) {
  return `${baseUrl}${publicPath}`;
}

export async function saveImageUpload(file, { subdirectory, filenamePrefix }) {
  if (!file) {
    throw new AppError("Image file is required.", 400);
  }

  const destination = uploadDirectories[subdirectory];

  if (!destination) {
    throw new AppError("Invalid upload destination.", 500);
  }

  const extension = MIME_TYPE_EXTENSIONS[file.mimetype];

  if (!extension) {
    throw new AppError("Unsupported file type. Upload a JPG, PNG, or WebP image.", 400);
  }

  ensureUploadDirectories();

  const filename = `${filenamePrefix}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(destination, filename);
  const publicPath = `/uploads/${subdirectory}/${filename}`;

  await fs.promises.writeFile(filePath, file.buffer, { flag: "wx" });

  return {
    filename,
    filePath,
    publicPath
  };
}

export async function deleteUploadFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteLocalUploadFromUrl(uploadUrl, subdirectory) {
  if (!uploadUrl) {
    return;
  }

  let parsed;

  try {
    parsed = new URL(uploadUrl, "http://local.invalid");
  } catch {
    return;
  }

  const expectedPrefix = `/uploads/${subdirectory}/`;

  if (!parsed.pathname.startsWith(expectedPrefix)) {
    return;
  }

  const filename = path.basename(decodeURIComponent(parsed.pathname));
  const directory = uploadDirectories[subdirectory];
  const filePath = path.resolve(directory, filename);
  const resolvedDirectory = path.resolve(directory);

  if (!filePath.startsWith(`${resolvedDirectory}${path.sep}`)) {
    return;
  }

  await deleteUploadFile(filePath);
}
