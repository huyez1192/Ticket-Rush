import PagePlaceholder from "../PagePlaceholder";

export default function CheckoutFailurePage() {
  return (
    <PagePlaceholder
      title="Checkout failed"
      purpose="Derived recovery route for failed or expired checkout attempts."
      note="Phase 11 should define the recovery path for expired locks and unpaid orders."
      status="Expired"
    />
  );
}
