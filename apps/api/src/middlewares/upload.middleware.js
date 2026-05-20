import multer from "multer";

import { AppError } from "../common/errors/AppError.js";
import { ALLOWED_IMAGE_MIME_TYPES } from "../common/utils/localUpload.js";

const BYTES_IN_MEGABYTE = 1024 * 1024;

function imageFileFilter(_req, file, callback) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    callback(new AppError("Unsupported file type. Upload a JPG, PNG, or WebP image.", 400));
    return;
  }

  callback(null, true);
}

function mapMulterError(error, { label, maxMegabytes, fieldName }) {
  if (error.code === "LIMIT_FILE_SIZE") {
    return new AppError(`${label} must be ${maxMegabytes}MB or smaller.`, 400);
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return new AppError(`Upload a file in the ${fieldName} field.`, 400);
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return new AppError("Upload one image file at a time.", 400);
  }

  return new AppError("Image upload failed. Check the selected file and try again.", 400);
}

function createSingleImageUpload({ fieldName, maxMegabytes, label }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxMegabytes * BYTES_IN_MEGABYTE,
      files: 1
    },
    fileFilter: imageFileFilter
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError) {
        next(mapMulterError(error, { label, maxMegabytes, fieldName }));
        return;
      }

      next(error);
    });
  };
}

export const uploadAvatarImage = createSingleImageUpload({
  fieldName: "avatar",
  maxMegabytes: 2,
  label: "Avatar image"
});

export const uploadEventImage = createSingleImageUpload({
  fieldName: "image",
  maxMegabytes: 5,
  label: "Event image"
});
