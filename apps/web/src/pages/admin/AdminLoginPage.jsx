import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoFull from "../../assets/logo-full.png";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import { useAuth } from "../../features/auth/useAuth";
import { getFieldError } from "../../utils/formErrors";
import { getRoleNames } from "../../utils/getRoleNames";
import { mapApiError } from "../../utils/mapApiError";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, clearAuth } = useAuth();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const validationErrors = validateAdminLogin(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const user = await login({
        usernameOrEmail: form.usernameOrEmail.trim(),
        password: form.password,
      });
      const roles = getRoleNames(user);

      if (!roles.includes("Admin")) {
        clearAuth();
        navigate("/unauthorized", { replace: true, state: { reason: "Admin access requires an Admin role." } });
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (apiError) {
      const mappedError = mapApiError(apiError);
      setError(mappedError);
      setFieldErrors(mappedError.errors || {});
    }
  }

  return (
    <main className="auth-page auth-page--admin">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <img className="brand-logo brand-logo-full auth-logo-image auth-logo-image--inverse" src={logoFull} alt="Ticket Rush" />
          <p className="page-kicker">Ticket Rush Admin</p>
          <h2 className="auth-brand-title">Operational control for events and ticketing.</h2>
          <p className="auth-brand-copy">Authorized access only. Admin routes are protected by role-based guards.</p>
        </div>
      </section>
      <section className="auth-form-panel">
        <Card className="auth-form-card">
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="auth-form-header">
              <img className="brand-logo brand-logo-full auth-form-logo" src={logoFull} alt="Ticket Rush" />
              <p className="page-kicker">Admin portal</p>
              <h1>Sign in</h1>
              <p>Use an account with the Admin role.</p>
            </div>
            {error ? <ErrorState title="Login failed" message={error.message} /> : null}
            <Input
              label="Username or email"
              name="usernameOrEmail"
              value={form.usernameOrEmail}
              onChange={updateField}
              error={getFieldError(fieldErrors, "usernameOrEmail")}
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              error={getFieldError(fieldErrors, "password")}
              autoComplete="current-password"
              required
            />
            <Button type="submit" loading={isLoading} disabled={isLoading}>
              Login as admin
            </Button>
          </form>
          <footer className="auth-links">
            <Link className="auth-link" to="/login">Customer login</Link>
            <Link className="auth-link" to="/events">Back to events</Link>
          </footer>
        </Card>
      </section>
    </main>
  );
}

function validateAdminLogin(values) {
  const errors = {};

  if (!values.usernameOrEmail.trim()) {
    errors.usernameOrEmail = "Username or email is required.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}
