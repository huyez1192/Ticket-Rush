import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import { useAuth } from "../../features/auth/useAuth";
import { getRoleNames } from "../../utils/getRoleNames";
import { mapApiError } from "../../utils/mapApiError";

export default function AdminLoginPage() {
  const navigate = useNavigate();
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
      const roles = getRoleNames(user);
      navigate(roles.includes("Admin") ? "/admin/dashboard" : "/unauthorized", { replace: true });
    } catch (apiError) {
      setError(mapApiError(apiError));
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div>
          <p className="page-kicker">Ticket Rush Admin</p>
          <h1>Operational control for events and ticketing.</h1>
        </div>
        <p>Admin access uses the shared login API and role-based guards.</p>
      </section>
      <section className="auth-form-panel">
        <Card className="auth-form-card">
          <form className="form-stack" onSubmit={handleSubmit}>
            <div>
              <p className="page-kicker">Admin login</p>
              <h2>Sign in</h2>
            </div>
            {error ? <ErrorState title="Login failed" message={error.message} /> : null}
            <Input label="Username or email" name="usernameOrEmail" value={form.usernameOrEmail} onChange={updateField} required />
            <Input label="Password" name="password" type="password" value={form.password} onChange={updateField} required />
            <Button type="submit" loading={isLoading}>
              Login as admin
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
