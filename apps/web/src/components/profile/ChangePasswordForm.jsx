import { useState } from "react";
import { getFieldError } from "../../utils/formErrors";
import Button from "../common/Button";
import Input from "../common/Input";
import "./profile.css";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

export default function ChangePasswordForm({ errors, loading, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [clientError, setClientError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setClientError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.newPassword !== form.confirmNewPassword) {
      setClientError("New password and confirmation must match.");
      return;
    }

    await onSubmit?.({
      oldPassword: form.currentPassword,
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setForm(initialForm);
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div>
        <span className="profile-eyebrow">Security</span>
        <h2>Change password</h2>
      </div>
      <div className="profile-form__grid">
        <Input
          name="currentPassword"
          type="password"
          label="Current password"
          value={form.currentPassword}
          onChange={handleChange}
          error={getFieldError(errors, "oldPassword") || getFieldError(errors, "currentPassword")}
          required
        />
        <Input
          name="newPassword"
          type="password"
          label="New password"
          value={form.newPassword}
          onChange={handleChange}
          error={getFieldError(errors, "newPassword")}
          minLength={6}
          required
        />
        <Input
          name="confirmNewPassword"
          type="password"
          label="Confirm new password"
          value={form.confirmNewPassword}
          onChange={handleChange}
          error={clientError}
          minLength={6}
          required
        />
      </div>
      <div className="profile-form__actions">
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? "Changing..." : "Change password"}
        </Button>
      </div>
    </form>
  );
}
