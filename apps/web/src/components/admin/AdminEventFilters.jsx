import { EVENT_STATUSES } from "../../constants/statuses";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import "./admin.css";

export default function AdminEventFilters({ values, onChange, onSubmit, onReset, loading }) {
  return (
    <form className="admin-filters" onSubmit={onSubmit}>
      <Input
        label="Search"
        name="keyword"
        value={values.keyword}
        onChange={onChange}
        placeholder="Search events by name, description, or venue"
      />
      <Select label="Status" name="status" value={values.status} onChange={onChange}>
        <option value="">All statuses</option>
        {EVENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
      <div className="admin-row-actions">
        <Button type="submit" loading={loading}>
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
