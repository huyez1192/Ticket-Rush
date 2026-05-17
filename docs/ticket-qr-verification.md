# Ticket QR Verification

## Frontend QR Rendering

Customer ticket detail renders a real QR image in the browser from the ticket token returned by the existing ticket APIs.

The QR value is exactly the stored ticket `qrCode` token. It does not encode event, customer, seat, or JSON metadata.

The customer view also displays the raw token in a monospace block with a Copy token action so admins can still verify manually by paste.

## Admin Paste-token Verification

Admins verify tickets from `/admin/tickets/verify` by pasting the token into the existing form. The frontend sends:

```json
{
  "qrCode": "TICKETRUSH-..."
}
```

to:

```txt
POST /api/admin/tickets/verify
```

Camera scanning is not included in this phase.

## One-time Backend Enforcement

The backend is the source of truth. A QR image is only a visual representation of the token.

On first verification, the API atomically updates one matching unused ticket:

```txt
qrCode matches
status is Issued/Valid or missing on an old ticket
```

The update marks the ticket:

```txt
status = Used
verifiedAt = now
checkedInAt = now
verifiedByAdminId = current admin
```

If two admins submit the same token at the same time, only one atomic update can succeed.

## Second Verification

After a ticket has been marked `Used`, the same token no longer verifies as valid. The API returns:

```json
{
  "valid": false,
  "reason": "already_used",
  "message": "Ticket has already been used."
}
```

The response may include a safe ticket summary and check-in timestamp for admin context.

## Security Notes

- Frontend QR rendering does not grant access.
- Ticket status and one-time use are enforced by the backend.
- Admin verification does not alter orders, seats, seat locks, payments, or other tickets from the same order.
- Raw tokens are exposed only through customer-owned ticket views and admin verification flows.
