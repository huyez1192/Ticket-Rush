import { useState } from "react";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Input from "../common/Input";
import AdminEventImagePreview from "./AdminEventImagePreview";
import "./admin.css";

export default function AdminEventImageManager({ images = [], onAdd, onDelete, loading, error }) {
  const [imageUrl, setImageUrl] = useState("");
  const [localError, setLocalError] = useState("");

  function handleAddImage() {
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

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddImage();
    }
  }

  return (
    <section className="admin-image-manager">
      <div className="admin-image-manager__actions">
        <Input
          label="Image URL"
          name="imageUrl"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          error={localError}
          placeholder="https://example.com/event.jpg"
        />
        <Button type="button" loading={loading} onClick={handleAddImage}>
          Add image
        </Button>
      </div>
      {error ? <p className="field__error">{error}</p> : null}
      {images.length ? (
        <ul className="admin-image-list">
          {images.map((image) => (
            <li className="admin-image-row" key={image.id || image.imageUrl}>
              <AdminEventImagePreview image={image} alt="Event image preview" />
              <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => onDelete?.(image)}>
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
