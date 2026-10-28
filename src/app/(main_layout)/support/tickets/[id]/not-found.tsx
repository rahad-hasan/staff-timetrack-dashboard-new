import { TicketNotFound } from "@/components/Support/ticket/TicketNotFound";

/** Foreign or unknown ticket id (the API's 404, §17.2 item 2 — never "access denied"). */
export default function TicketNotFoundPage() {
  return <TicketNotFound reason="missing" />;
}
