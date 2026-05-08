import { useEffect, useState } from "react";
import * as userApi from "../../api/userApi";
import ChangePasswordForm from "../../components/profile/ChangePasswordForm";
import ProfileForm from "../../components/profile/ProfileForm";
import { useAuth } from "../../features/auth/useAuth";
import "./../../components/profile/profile.css";

export default function ProfilePage({ admin = false }) {
  const { user, updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await userApi.getMyProfile();
        if (active) {
          setProfile(data);
          updateCurrentUser?.(data);
        }
      } catch (apiError) {
        if (active) {
          setError(apiError.message);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [updateCurrentUser]);

  async function handleProfileSubmit(payload) {
    setProfileLoading(true);
    setProfileErrors(null);
    setError("");
    setMessage("");

    try {
      const updated = await userApi.updateMyProfile(payload);
      setProfile(updated);
      updateCurrentUser?.(updated);
      setMessage("Profile updated successfully.");
    } catch (apiError) {
      setProfileErrors(apiError.errors);
      setError(apiError.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(payload) {
    setPasswordLoading(true);
    setPasswordErrors(null);
    setError("");
    setMessage("");

    try {
      await userApi.changeMyPassword(payload);
      setMessage("Password changed successfully.");
    } catch (apiError) {
      setPasswordErrors(apiError.errors);
      setError(apiError.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className={`profile-page ${admin ? "profile-page--admin" : ""}`.trim()}>
      <header className="profile-page__header">
        <div>
          <span className="profile-eyebrow">{admin ? "Admin account" : "Customer account"}</span>
          <h1>Profile</h1>
          <p>Manage your visible account details and password.</p>
        </div>
      </header>

      {message ? <div className="profile-message">{message}</div> : null}
      {error ? <div className="profile-message profile-message--error">{error}</div> : null}

      <div className="profile-page__content">
        <ProfileForm user={profile} errors={profileErrors} loading={profileLoading} onSubmit={handleProfileSubmit} />
        <ChangePasswordForm errors={passwordErrors} loading={passwordLoading} onSubmit={handlePasswordSubmit} />
      </div>
    </div>
  );
}
