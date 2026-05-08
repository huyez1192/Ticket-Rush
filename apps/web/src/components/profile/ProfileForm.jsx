import { useEffect, useState } from "react";
import { getFieldError } from "../../utils/formErrors";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import ProfileAvatar from "./ProfileAvatar";
import "./profile.css";

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
    avatarUrl: user?.avatarUrl || "",
  };
}

export default function ProfileForm({ user, errors, loading, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(user));

  useEffect(() => {
    setForm(buildInitialForm(user));
  }, [user]);

  const previewUser = { ...user, ...form };

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
      avatarUrl: form.avatarUrl.trim() || null,
    });
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
        <Input
          name="avatarUrl"
          type="url"
          label="Avatar URL"
          value={form.avatarUrl}
          onChange={handleChange}
          placeholder="https://example.com/avatar.jpg"
          error={getFieldError(errors, "avatarUrl")}
          helper="Paste an image URL. Upload storage is not part of this phase."
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
