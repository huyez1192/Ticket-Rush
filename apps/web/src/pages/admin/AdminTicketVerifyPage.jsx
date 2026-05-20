import { useState } from "react";
import { getEventSeatMap, verifyTicket } from "../../api/adminApi";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminTicketVerifyForm from "../../components/admin/AdminTicketVerifyForm";
import AdminTicketVerifyResult from "../../components/admin/AdminTicketVerifyResult";
import LoadingState from "../../components/common/LoadingState";
import { normalizeTicketVerificationResponse } from "../../utils/adminTicketMappers";
import { mapApiError } from "../../utils/mapApiError";
import { applySeatDisplayLabelToSeat, buildSeatDisplayLabelLookup } from "../../utils/seatDisplayLabels";
import { normalizeSeatMap } from "../../utils/seatMappers";

export default function AdminTicketVerifyPage() {
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [result, setResult] = useState(null);

  async function handleVerify(payload) {
    setFieldError("");

    if (!payload.qrCode) {
      setFieldError("Ticket QR/token is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyTicket({ qrCode: payload.qrCode });
      let normalized = normalizeTicketVerificationResponse(response);

      if (normalized.ticket?.event?.id) {
        try {
          const seatMapPayload = await getEventSeatMap(normalized.ticket.event.id);
          const normalizedMap = normalizeSeatMap(seatMapPayload);
          normalized = {
            ...normalized,
            ticket: {
              ...normalized.ticket,
              seat: applySeatDisplayLabelToSeat(
                normalized.ticket.seat,
                buildSeatDisplayLabelLookup(normalizedMap.sections),
              ),
            },
          };
        } catch {
          // Verification result remains valid if display-only seat labels cannot be enriched.
        }
      }

      setResult(normalized);
    } catch (error) {
      const normalized = mapApiError(error);
      setResult(
        normalizeTicketVerificationResponse({
          valid: false,
          message: normalized.message,
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFieldError("");
    setResult(null);
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        kicker="Gate operations"
        title="Verify ticket"
        subtitle="Paste a ticket QR token from the customer ticket detail. Camera scanning is deferred for a later phase."
      />

      <div className="admin-ticket-verify-layout">
        <AdminTicketVerifyForm onSubmit={handleVerify} onReset={handleReset} loading={loading} error={fieldError} />
        <div className="page-stack">
          {loading ? <LoadingState title="Verifying ticket" message="Checking the QR token against issued tickets." /> : null}
          {!loading ? <AdminTicketVerifyResult result={result} /> : null}
        </div>
      </div>
    </div>
  );
}
