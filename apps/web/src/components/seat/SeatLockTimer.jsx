import { useEffect, useMemo, useState } from "react";
import "./seat.css";

export default function SeatLockTimer({ expiresAt, onExpired }) {
  const expiresAtTime = useMemo(() => {
    const date = expiresAt ? new Date(expiresAt) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  }, [expiresAt]);
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiresAtTime));

  useEffect(() => {
    setRemainingMs(getRemainingMs(expiresAtTime));

    if (!expiresAtTime) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const nextRemainingMs = getRemainingMs(expiresAtTime);
      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs <= 0) {
        window.clearInterval(timer);
        onExpired?.();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAtTime, onExpired]);

  if (!expiresAtTime) {
    return <span className="seat-lock-timer">Lock active</span>;
  }

  if (remainingMs <= 0) {
    return <span className="seat-lock-timer seat-lock-timer--expired">Expired</span>;
  }

  return <span className="seat-lock-timer">{formatRemaining(remainingMs)}</span>;
}

function getRemainingMs(expiresAtTime) {
  return expiresAtTime ? Math.max(0, expiresAtTime - Date.now()) : null;
}

function formatRemaining(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
