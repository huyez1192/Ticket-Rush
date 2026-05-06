import { useState } from "react";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Input from "../common/Input";
import "./admin.css";

export default function AdminEventImageManager({ images = [], onAdd, onDelete, loading, error }) {
  const [imageUrl, setImageUrl] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (!imageUrl.trim()) {
      setLocalError("Image URL is required.");
      return;
    }

    try {
      new URL(imageUrl);
    } catch {
      setLocalError("Enter a valid URL.");
      return;
    }

    onAdd?.({ imageUrl: imageUrl.trim() });
    setImageUrl("");
  }

  return (
    <section className="admin-image-manager">
      <form className="admin-image-manager__actions" onSubmit={handleSubmit}>
        <Input
          label="Image URL"
          name="imageUrl"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          error={localError}
          placeholder="https://example.com/event.jpg"
        />
        <Button type="submit" loading={loading}>
          Add image
        </Button>
      </form>
      {error ? <p className="field__error">{error}</p> : null}
      {images.length ? (
        <ul className="admin-image-list">
          {images.map((image) => (
            <li className="admin-image-row" key={image.id || image.imageUrl}>
              <a className="admin-image-row__url" href={image.imageUrl} target="_blank" rel="noreferrer">
                {image.imageUrl}
              </a>
              <Button variant="danger" size="sm" onClick={() => onDelete?.(image)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No images yet" message="Add image URLs that can be used by the customer event pages." />
      )}
    </section>
  );
}
