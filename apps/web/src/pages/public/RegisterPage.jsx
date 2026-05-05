import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { useAuth } from "../../features/auth/useAuth";
import { mapApiError } from "../../utils/mapApiError";

const genderOptions = [
  { value: "", label: "Prefer not to say" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
      });
      navigate("/login", { replace: true });
    } catch (apiError) {
      setError(mapApiError(apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div>
          <p className="page-kicker">Ticket Rush</p>
          <h1>Create a customer account.</h1>
        </div>
        <p>Registration follows the Swagger contract, including username, email, password, birth date, and gender.</p>
      </section>
      <section className="auth-form-panel">
        <Card className="auth-form-card">
          <form className="form-stack" onSubmit={handleSubmit}>
            <div>
              <p className="page-kicker">Customer register</p>
              <h2>Join Ticket Rush</h2>
            </div>
            {error ? <ErrorState title="Registration failed" message={error.message} /> : null}
            <Input label="Username" name="username" value={form.username} onChange={updateField} minLength={3} required />
            <Input label="Full name" name="fullName" value={form.fullName} onChange={updateField} />
            <Input label="Email" name="email" type="email" value={form.email} onChange={updateField} required />
            <Input label="Password" name="password" type="password" value={form.password} onChange={updateField} minLength={6} required />
            <Input label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} />
            <Select label="Gender" name="gender" value={form.gender} onChange={updateField} options={genderOptions} />
            <Button type="submit" loading={isSubmitting}>
              Register
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
