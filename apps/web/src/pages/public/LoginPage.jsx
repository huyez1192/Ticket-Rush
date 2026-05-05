import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import { useAuth } from "../../features/auth/useAuth";
import { mapApiError } from "../../utils/mapApiError";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [error, setError] = useState(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    try {
      const user = await login(form);
      const roleNames = (user.roles || []).map((role) => (typeof role === "string" ? role : role.name)).filter(Boolean);
      const from = location.state?.from?.pathname;
      navigate(roleNames.includes("Admin") ? "/admin/dashboard" : from || "/events", { replace: true });
    } catch (apiError) {
      setError(mapApiError(apiError));
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div>
          <p className="page-kicker">Ticket Rush</p>
          <h1>Sign in for faster ticket checkout.</h1>
        </div>
        <p>Phase 8 wires the shared auth foundation. Full visual polish arrives in the auth phase.</p>
      </section>
      <section className="auth-form-panel">
        <Card className="auth-form-card">
          <form className="form-stack" onSubmit={handleSubmit}>
            <div>
              <p className="page-kicker">Customer login</p>
              <h2>Welcome back</h2>
            </div>
            {error ? <ErrorState title="Login failed" message={error.message} /> : null}
            <Input label="Username or email" name="usernameOrEmail" value={form.usernameOrEmail} onChange={updateField} required />
            <Input label="Password" name="password" type="password" value={form.password} onChange={updateField} required />
            <Button type="submit" loading={isLoading}>
              Login
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
