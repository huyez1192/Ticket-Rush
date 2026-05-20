import { useEffect, useMemo, useState } from "react";
import "./seat.css";

export default function SeatLockTimer({ expiresAt, serverNow = null, serverNowReceivedAt = null, onExpired }) {
  const expiresAtTime = useMemo(() => {
    const date = expiresAt ? new Date(expiresAt) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  }, [expiresAt]);
  const serverNowTime = useMemo(() => {
    const date = serverNow ? new Date(serverNow) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  }, [serverNow]);
  const receivedAtTime = Number.isFinite(Number(serverNowReceivedAt)) ? Number(serverNowReceivedAt) : null;
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiresAtTime, serverNowTime, receivedAtTime));

  useEffect(() => {
    setRemainingMs(getRemainingMs(expiresAtTime, serverNowTime, receivedAtTime));

    if (!expiresAtTime) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const nextRemainingMs = getRemainingMs(expiresAtTime, serverNowTime, receivedAtTime);
      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs <= 0) {
        window.clearInterval(timer);
        onExpired?.();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAtTime, onExpired, receivedAtTime, serverNowTime]);

  if (!expiresAtTime) {
    return <span className="seat-lock-timer">Lock active</span>;
  }

  if (remainingMs <= 0) {
    return <span className="seat-lock-timer seat-lock-timer--expired">Expired</span>;
  }

  return <span className="seat-lock-timer">{formatRemaining(remainingMs)}</span>;
}

function getRemainingMs(expiresAtTime, serverNowTime = null, receivedAtTime = null) {
  if (!expiresAtTime) {
    return null;
  }

  if (serverNowTime && receivedAtTime) {
    return Math.max(0, expiresAtTime - (serverNowTime + Date.now() - receivedAtTime));
  }

  return Math.max(0, expiresAtTime - Date.now());
}

function formatRemaining(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
