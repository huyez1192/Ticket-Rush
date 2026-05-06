import { useState } from "react";
import { getImageUrl } from "../../utils/eventMappers";
import "./admin.css";

export default function AdminEventImagePreview({ image, alt = "Event image", showUrl = true }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getImageUrl(image);

  return (
    <div className="admin-image-preview">
      <div className="admin-image-preview__media">
        {imageUrl && !failed ? (
          <img src={imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span>Image unavailable</span>
        )}
      </div>
      {showUrl && imageUrl ? (
        <a className="admin-image-preview__url" href={imageUrl} target="_blank" rel="noreferrer">
          {imageUrl}
        </a>
      ) : null}
    </div>
  );
}
