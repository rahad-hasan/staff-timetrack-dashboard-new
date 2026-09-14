import Link from "next/link";
import { Building2, CreditCard, Headset, RefreshCw } from "lucide-react";

import { AssurancePanel, type AssuranceRow } from "./TrustLogos";

/**
 * The failure-state twin of `ShopWithConfidencePanel`: it takes over the
 * checkout right column once a payment has been declined.
 *
 * A decline arrives from Stripe as a code we can map to a headline, but the
 * user still has to decide what to actually do next — so these four rows are
 * the remedies in the order that clears the most declines soonest: a typo, then
 * the issuer's own block (which only the cardholder can lift), then a different
 * card, then us. The last row is a real link rather than a phone-number-shaped
 * sentence because by the time someone reads it, self-service has already
 * failed twice.
 */
export default function NeedHelpPanel({
  /**
   * Checkout renders outside `(main_layout)`, so the panel takes the support
   * destination as a prop instead of assuming the in-app route is reachable
   * from wherever it is mounted.
   */
  supportHref = "/support",
}: {
  supportHref?: string;
}) {
  // Only the last row depends on a prop; the rest is fixed copy.
  const rows: AssuranceRow[] = [
    {
      icon: CreditCard,
      tone: "blue",
      title: "Check your card details",
      body: "Make sure the card number, expiry date and CVV are correct.",
    },
    {
      icon: Building2,
      tone: "green",
      title: "Confirm with your bank",
      body: "Your bank may have blocked the payment.",
    },
    {
      icon: RefreshCw,
      tone: "purple",
      title: "Try a different payment method",
      body: "Use another card.",
    },
    {
      icon: Headset,
      tone: "orange",
      title: "Still having issues?",
      body: (
        <Link
          href={supportHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Contact our support team and we&apos;ll be happy to help you.
        </Link>
      ),
    },
  ];

  return <AssurancePanel title="Need Help?" rows={rows} />;
}
