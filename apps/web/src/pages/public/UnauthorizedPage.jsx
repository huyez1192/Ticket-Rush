import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";

export default function UnauthorizedPage() {
  return (
    <div className="page-shell">
      <ErrorState
        title="Access denied"
        message="Your current account does not have permission to open this area."
        action={
          <Link to="/events">
            <Button variant="outline">Back to events</Button>
          </Link>
        }
      />
    </div>
  );
}
