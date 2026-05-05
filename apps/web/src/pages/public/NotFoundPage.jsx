import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";

export default function NotFoundPage() {
  return (
    <div className="page-shell">
      <EmptyState
        title="Page not found"
        message="This route does not match a Ticket Rush screen."
        action={
          <Link to="/events">
            <Button>Go to events</Button>
          </Link>
        }
      />
    </div>
  );
}
