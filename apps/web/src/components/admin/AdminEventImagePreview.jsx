import { useState } from "react";
import { getImageUrl } from "../../utils/eventMappers";
import "./admin.css";

export default function AdminEventImagePreview({ image, alt = "Event image", showUrl = true, variant = "compact" }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getImageUrl(image);
  const isCard = variant === "card";
  const hasImage = Boolean(imageUrl && !failed);

  return (
    <div className={`admin-image-preview admin-image-preview--${variant}`.trim()}>
      <div className={`admin-image-preview__media ${hasImage ? "" : "admin-image-preview__media--empty"}`.trim()}>
        {hasImage ? (
          <img src={imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span>Image unavailable</span>
        )}
      </div>
      {imageUrl ? (
        <div className="admin-image-preview__details">
          {isCard ? (
            <a className="btn btn--outline btn--sm admin-image-preview__action" href={imageUrl} target="_blank" rel="noreferrer">
              Open image
            </a>
          ) : null}
          {showUrl ? (
            <a className="admin-image-preview__url" href={imageUrl} target="_blank" rel="noreferrer" title={imageUrl}>
              {imageUrl}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
