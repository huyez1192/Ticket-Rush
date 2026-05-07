import { ORDER_STATUSES } from "../../constants/statuses";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import "./admin-orders.css";

export default function AdminOrderFilters({ values, onChange, onSubmit, onReset, loading }) {
  return (
    <form className="admin-filters admin-order-filters" onSubmit={onSubmit}>
      <Select label="Order status" name="status" value={values.status} onChange={onChange}>
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
      <Input
        label="Event ID"
        name="eventId"
        value={values.eventId}
        onChange={onChange}
        placeholder="MongoDB event id"
        helper="Backend supports exact eventId filtering."
      />
      <Select label="Rows" name="limit" value={String(values.limit)} onChange={onChange}>
        <option value="10">10 rows</option>
        <option value="20">20 rows</option>
        <option value="50">50 rows</option>
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
