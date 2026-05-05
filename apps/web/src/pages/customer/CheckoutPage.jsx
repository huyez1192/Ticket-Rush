import { useParams } from "react-router-dom";
import PagePlaceholder from "../PagePlaceholder";

export default function CheckoutPage() {
  const { orderId } = useParams();

  return (
    <PagePlaceholder
      title="Checkout"
      purpose={`Authenticated checkout shell for order ${orderId}.`}
      note="Phase 11 will add order loading, mock checkout confirmation, and expired-lock recovery."
      status="Pending"
    />
  );
}
