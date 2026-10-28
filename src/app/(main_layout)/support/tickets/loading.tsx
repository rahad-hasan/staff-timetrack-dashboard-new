import TicketsPageSkeleton from "@/components/Support/list/TicketsPageSkeleton";

/** Streams while the three first-paint reads run — the page's own geometry, so nothing shifts. */
const SupportTicketsLoading = () => <TicketsPageSkeleton />;

export default SupportTicketsLoading;
