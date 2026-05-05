import Button from "./Button";

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
        Previous
      </Button>
      <BadgePage page={page} totalPages={totalPages} />
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
        Next
      </Button>
    </nav>
  );
}

function BadgePage({ page, totalPages }) {
  return (
    <span className="badge badge--primary" aria-current="page">
      {page} / {totalPages}
    </span>
  );
}
