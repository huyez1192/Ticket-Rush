import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoFull from "../../assets/logo-full.png";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import { useAuth } from "../../features/auth/useAuth";
import { getFieldError } from "../../utils/formErrors";
import { getRoleNames } from "../../utils/getRoleNames";
import { mapApiError } from "../../utils/mapApiError";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const registeredMessage = location.state?.registered ? "Account created. Sign in with your new customer credentials." : "";

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const validationErrors = validateLogin(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const user = await login({
        usernameOrEmail: form.usernameOrEmail.trim(),
        password: form.password,
      });
      const roleNames = getRoleNames(user);
      const from = location.state?.from?.pathname;
      navigate(roleNames.includes("Admin") ? "/admin/dashboard" : from || "/events", { replace: true });
    } catch (apiError) {
      const mappedError = mapApiError(apiError);
      setError(mappedError);
      setFieldErrors(mappedError.errors || {});
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <img className="brand-logo brand-logo-full auth-logo-image auth-logo-image--inverse" src={logoFull} alt="Ticket Rush" />
          <p className="page-kicker">Ticket Rush</p>
          <h2 className="auth-brand-title">Digital ticketing with fast seat access.</h2>
          <p className="auth-brand-copy">
            Sign in to lock seats, finish checkout, and manage your electronic tickets from one place.
          </p>
        </div>
        <div className="auth-feature-card">
          <div className="auth-feature-icon">T</div>
          <div>
            <p className="page-kicker">Customer access</p>
            <p>Ticket booking, checkout, and my tickets are protected by your customer session.</p>
          </div>
        </div>
      </section>
      <section className="auth-form-panel">
        <Card className="auth-form-card">
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="auth-form-header">
              <img className="brand-logo brand-logo-full auth-form-logo" src={logoFull} alt="Ticket Rush" />
              <p className="page-kicker">Customer login</p>
              <h1>Welcome back</h1>
              <p>Use your username or email address to continue.</p>
            </div>
            {registeredMessage ? <Card className="auth-success">{registeredMessage}</Card> : null}
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
            <div className="auth-actions">
              <Button type="submit" loading={isLoading} disabled={isLoading}>
                Login
              </Button>
            </div>
          </form>
          <footer className="auth-links">
            <span>
              New to Ticket Rush? <Link className="auth-link" to="/register">Create an account</Link>
            </span>
            <Link className="auth-link" to="/admin/login">Admin login</Link>
          </footer>
        </Card>
      </section>
    </main>
  );
}

function validateLogin(values) {
  const errors = {};

  if (!values.usernameOrEmail.trim()) {
    errors.usernameOrEmail = "Username or email is required.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}
