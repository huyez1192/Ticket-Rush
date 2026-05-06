import { getImageUrl } from "../../utils/eventMappers";
import "./event.css";

export default function EventImageGallery({ images = [], title = "Event image" }) {
  const urls = images.map(getImageUrl).filter(Boolean);
  const primaryUrl = urls[0];

  return (
    <section className="event-gallery" aria-label="Event images">
      <div className="event-gallery__main">
        {primaryUrl ? <img src={primaryUrl} alt={title} /> : <div className="event-image-placeholder">Ticket Rush</div>}
      </div>
      {urls.length > 1 ? (
        <div className="event-gallery__thumbs">
          {urls.slice(1, 5).map((url) => (
            <div className="event-gallery__thumb" key={url}>
              <img src={url} alt={title} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
