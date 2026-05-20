import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import AdminEventImagePreview from "./AdminEventImagePreview";
import "./admin.css";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxEventImageBytes = 5 * 1024 * 1024;

export default function AdminEventImageManager({ images = [], onUpload, onDelete, loading, error }) {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setLocalError("");

    if (!selectedFile) {
      setImageFile(null);
      return;
    }

    if (!acceptedImageTypes.includes(selectedFile.type)) {
      setImageFile(null);
      setLocalError("Upload a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > maxEventImageBytes) {
      setImageFile(null);
      setLocalError("Event image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setImageFile(selectedFile);
  }

  async function handleUpload() {
    setLocalError("");

    if (!imageFile) {
      setLocalError("Choose an event image first.");
      return;
    }

    const uploadedImage = await onUpload?.(imageFile);

    if (uploadedImage) {
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="admin-image-manager">
      <div className="admin-image-upload">
        <div className="admin-image-upload__copy">
          <span>Upload event image</span>
          <p>Choose a JPG, PNG, or WebP image up to 5MB.</p>
          <input
            ref={fileInputRef}
            className="admin-image-upload__input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={loading}
          />
          <strong className="admin-image-upload__filename">{imageFile ? imageFile.name : "No file selected"}</strong>
          {localError ? <span className="field__error">{localError}</span> : null}
        </div>
        {previewUrl ? (
          <div className="admin-image-upload__preview">
            <img src={previewUrl} alt="" />
          </div>
        ) : null}
        <Button type="button" loading={loading} disabled={!imageFile || loading} onClick={handleUpload}>
          Upload image
        </Button>
      </div>
      {error ? <p className="field__error">{error}</p> : null}
      {images.length ? (
        <ul className="admin-image-list">
          {images.map((image) => (
            <li className="admin-image-row" key={image.id || image.imageUrl}>
              <AdminEventImagePreview image={image} alt="Event image preview" showUrl={false} />
              <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => onDelete?.(image)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No images yet" message="Upload images that can be used by the customer event pages." />
      )}
    </section>
  );
}
