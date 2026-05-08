import { useMemo, useState } from "react";
import "./profile.css";

function getInitials(user) {
  const displayName = user?.fullName || user?.username || user?.email || "User";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
}

export default function ProfileAvatar({ user, size = "md", className = "" }) {
  const [failedUrl, setFailedUrl] = useState("");
  const avatarUrl = user?.avatarUrl && user.avatarUrl !== failedUrl ? user.avatarUrl : "";
  const initials = useMemo(() => getInitials(user), [user]);

  return (
    <span className={`profile-avatar profile-avatar--${size} ${className}`.trim()} aria-label={user?.fullName || user?.username || "User avatar"}>
      {avatarUrl ? <img src={avatarUrl} alt="" onError={() => setFailedUrl(avatarUrl)} /> : <span>{initials}</span>}
    </span>
  );
}
