import "./admin.css";

export default function AdminDataTable({ columns = [], children, footer, tableClassName = "" }) {
  return (
    <section className="admin-data-table">
      <div className="table-wrap">
        <table className={`table admin-table ${tableClassName}`.trim()}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
