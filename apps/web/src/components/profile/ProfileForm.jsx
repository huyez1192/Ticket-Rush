import { useEffect, useRef, useState } from "react";
import { getFieldError } from "../../utils/formErrors";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import ProfileAvatar from "./ProfileAvatar";
import "./profile.css";

const acceptedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarBytes = 2 * 1024 * 1024;

const genderOptions = [
  { value: "", label: "Not set" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

function buildInitialForm(user) {
  return {
    fullName: user?.fullName || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dateOfBirth || "",
  };
}

export default function ProfileForm({
  user,
  errors,
  loading,
  onSubmit,
  onAvatarUpload,
  avatarLoading = false,
  avatarError = "",
}) {
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarLocalError, setAvatarLocalError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm(buildInitialForm(user));
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const previewUser = { ...user, ...form, avatarUrl: avatarPreviewUrl || user?.avatarUrl };

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.({
      fullName: form.fullName.trim() || null,
      gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth || null,
    });
  }

  function handleAvatarChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setAvatarLocalError("");

    if (!selectedFile) {
      setAvatarFile(null);
      return;
    }

    if (!acceptedAvatarTypes.includes(selectedFile.type)) {
      setAvatarFile(null);
      setAvatarLocalError("Upload a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > maxAvatarBytes) {
      setAvatarFile(null);
      setAvatarLocalError("Avatar image must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    setAvatarFile(selectedFile);
  }

  async function handleAvatarUpload() {
    setAvatarLocalError("");

    if (!avatarFile) {
      setAvatarLocalError("Choose an avatar image first.");
      return;
    }

    const uploadedUser = await onAvatarUpload?.(avatarFile);

    if (uploadedUser) {
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="profile-form__identity">
        <ProfileAvatar user={previewUser} size="xl" />
        <div>
          <span className="profile-eyebrow">Signed in as</span>
          <h2>{user?.fullName || user?.username || user?.email || "Profile"}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-form__grid">
        <Input
          label="Username"
          value={user?.username || ""}
          disabled
          helper="Username changes are not enabled in this profile form."
        />
        <Input
          label="Email"
          value={user?.email || ""}
          disabled
          helper="Email changes are not enabled in this profile form."
        />
        <div className="profile-upload profile-form__full">
          <div className="profile-upload__body">
            <span className="profile-upload__label">Profile avatar</span>
            <p>Upload a JPG, PNG, or WebP image up to 2MB.</p>
            <input
              ref={fileInputRef}
              className="profile-upload__input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarLoading}
            />
            <span className="profile-upload__filename">
              {avatarFile ? avatarFile.name : "No file selected"}
            </span>
            {avatarLocalError || avatarError ? (
              <span className="field__error">{avatarLocalError || avatarError}</span>
            ) : null}
          </div>
          <Button type="button" variant="outline" loading={avatarLoading} disabled={!avatarFile || avatarLoading} onClick={handleAvatarUpload}>
            Upload avatar
          </Button>
        </div>
        <Input
          name="fullName"
          label="Full name"
          value={form.fullName}
          onChange={handleChange}
          error={getFieldError(errors, "fullName")}
        />
        <Select
          name="gender"
          label="Gender"
          value={form.gender}
          onChange={handleChange}
          options={genderOptions}
          error={getFieldError(errors, "gender")}
        />
        <Input
          name="dateOfBirth"
          type="date"
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={handleChange}
          error={getFieldError(errors, "dateOfBirth")}
        />
      </div>

      <div className="profile-form__actions">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
