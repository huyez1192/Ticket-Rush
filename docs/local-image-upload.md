# Local Image Uploads

Ticket Rush stores demo uploads on the local API filesystem.

## Storage folders

- Avatars: `apps/api/uploads/avatars/`
- Event images: `apps/api/uploads/event-images/`

The API serves these files from:

- `/uploads/avatars/<filename>`
- `/uploads/event-images/<filename>`

In local development, saved URLs use the API host, for example:

```txt
http://localhost:5000/uploads/avatars/avatar-xxx.webp
http://localhost:5000/uploads/event-images/event-image-xxx.jpg
```

## Endpoints

- `POST /api/users/me/avatar`
  - Authenticated users only.
  - `multipart/form-data` field: `avatar`
  - Updates the current user's `avatarUrl`.

- `POST /api/admin/events/:eventId/images/upload`
  - Admin users only.
  - `multipart/form-data` field: `image`
  - Adds an event image record using the uploaded file URL.

## Validation

Allowed MIME types:

- `image/jpeg`
- `image/png`
- `image/webp`

Size limits:

- Avatar image: 2MB
- Event image: 5MB

The backend validates MIME type and file size. Filenames are generated with a timestamp and random suffix; original local filenames are not used as stored filenames.

## Git ignore

`apps/api/uploads/` is ignored in `.gitignore` so runtime uploads are not committed.

## Limitation

Local filesystem uploads are suitable for development and demo environments. Production deployments should use object storage such as S3, Cloudinary, or another managed storage service.
