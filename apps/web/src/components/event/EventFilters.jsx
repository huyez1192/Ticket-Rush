import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import "./event.css";

const statusOptions = [
  { value: "", label: "All public statuses" },
  { value: "Published", label: "Published" },
  { value: "Selling", label: "Selling" },
  { value: "Closed", label: "Closed" },
];

export default function EventFilters({ filters, onChange, onSubmit, onReset, isLoading }) {
  function updateField(event) {
    onChange({ ...filters, [event.target.name]: event.target.value });
  }

  return (
    <form className="event-filters" onSubmit={onSubmit}>
      <Input
        className="event-filters__search"
        label="Search"
        name="keyword"
        value={filters.keyword}
        onChange={updateField}
        placeholder="Event name, venue, city"
      />
      <Select label="Status" name="status" value={filters.status} onChange={updateField} options={statusOptions} />
      <Input label="From" name="from" type="date" value={filters.from} onChange={updateField} />
      <Input label="To" name="to" type="date" value={filters.to} onChange={updateField} />
      <div className="auth-state-actions event-filters__actions">
        <Button type="submit" loading={isLoading} disabled={isLoading}>Apply</Button>
        <Button type="button" variant="outline" onClick={onReset}>Reset</Button>
      </div>
    </form>
  );
}
