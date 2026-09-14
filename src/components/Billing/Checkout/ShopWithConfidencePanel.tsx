import { Headset, Lock, RefreshCw, ShieldCheck } from "lucide-react";

import { AssurancePanel, type AssuranceRow } from "./TrustLogos";

/**
 * Right-column reassurance panel for the checkout page, sitting under the order
 * summary while the payment has not been attempted or is still in flight.
 *
 * The four rows answer the objections that actually stop a card being entered,
 * in the order they surface: is the connection safe, is the card handled
 * properly, am I locked in, and is anyone there if it goes wrong. A payment
 * decline swaps this panel for `NeedHelpPanel`, which answers the questions
 * that only exist after a failure.
 *
 * Copy note: the design mock reads "seciurity" and "locks-in". The corrected
 * spelling below is intentional — do not "restore" it to match the screenshot.
 */

/* Module scope: fixed marketing copy with nothing to derive per render. */
const ROWS: AssuranceRow[] = [
  {
    icon: Lock,
    tone: "blue",
    title: "Secure SSL encryption",
    body: "Your data is protected with bank-level security.",
  },
  {
    icon: ShieldCheck,
    tone: "green",
    title: "PCI DSS Compliant",
    body: "Our checkout meets the highest security standards.",
  },
  {
    icon: RefreshCw,
    tone: "purple",
    title: "Cancel anytime",
    body: "No lock-in, cancel or change the plan any time.",
  },
  {
    icon: Headset,
    tone: "orange",
    title: "24/7 Customer support",
    body: "Our team is here to help you, anytime.",
  },
];

export default function ShopWithConfidencePanel() {
  return <AssurancePanel title="Shop With Confidence" rows={ROWS} />;
}
