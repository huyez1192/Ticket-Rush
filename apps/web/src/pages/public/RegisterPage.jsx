import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { useAuth } from "../../features/auth/useAuth";
import { getFieldError } from "../../utils/formErrors";
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
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const validationErrors = validateRegister(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      if (form.fullName.trim()) {
        payload.fullName = form.fullName.trim();
      }
      if (form.dateOfBirth) {
        payload.dateOfBirth = form.dateOfBirth;
      }
      if (form.gender) {
        payload.gender = form.gender;
      }

      await register(payload);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (apiError) {
      const mappedError = mapApiError(apiError);
      setError(mappedError);
      setFieldErrors(mappedError.errors || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-form-panel">
        <Card className="auth-form-card auth-form-card--wide">
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="auth-form-header">
              <h1 className="auth-logo auth-logo--dark">TicketRush</h1>
              <p className="page-kicker">Customer register</p>
              <h2>Create your account</h2>
              <p>Register as a customer. Admin registration is not public.</p>
            </div>
            {error ? <ErrorState title="Registration failed" message={error.message} /> : null}
            <div className="auth-form-grid">
              <Input label="Username" name="username" value={form.username} onChange={updateField} error={getFieldError(fieldErrors, "username")} minLength={3} autoComplete="username" required />
              <Input label="Full name" name="fullName" value={form.fullName} onChange={updateField} error={getFieldError(fieldErrors, "fullName")} autoComplete="name" />
              <Input label="Email" name="email" type="email" value={form.email} onChange={updateField} error={getFieldError(fieldErrors, "email")} autoComplete="email" required />
              <Input label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} error={getFieldError(fieldErrors, "dateOfBirth")} />
              <Input label="Password" name="password" type="password" value={form.password} onChange={updateField} error={getFieldError(fieldErrors, "password")} minLength={6} autoComplete="new-password" required />
              <Input label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} error={getFieldError(fieldErrors, "confirmPassword")} autoComplete="new-password" required />
              <Select className="field--full" label="Gender" name="gender" value={form.gender} onChange={updateField} options={genderOptions} error={getFieldError(fieldErrors, "gender")} />
            </div>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              Register
            </Button>
          </form>
          <footer className="auth-links">
            <span>
              Already have an account? <Link className="auth-link" to="/login">Login</Link>
            </span>
            <Link className="auth-link" to="/events">Browse events</Link>
          </footer>
        </Card>
      </section>
    </main>
  );
}

function validateRegister(values) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.username.trim()) {
    errors.username = "Username is required.";
  } else if (values.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
