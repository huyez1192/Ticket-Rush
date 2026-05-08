import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import "./admin-users.css";

export default function AdminUserFilters({ values, roles = [], loading, onChange, onSubmit, onReset }) {
  const roleOptions = [
    { value: "", label: "All roles" },
    ...roles.map((role) => ({ value: role.id || role.name, label: role.name })),
  ];

  return (
    <form className="admin-user-filters" onSubmit={onSubmit}>
      <Input name="keyword" label="Search users" value={values.keyword} onChange={onChange} placeholder="Name, username, or email" />
      <Select name="role" label="Role" value={values.role} onChange={onChange} options={roleOptions} />
      <Button type="submit" disabled={loading}>Apply</Button>
      <Button type="button" variant="outline" onClick={onReset} disabled={loading}>Reset</Button>
    </form>
  );
}
