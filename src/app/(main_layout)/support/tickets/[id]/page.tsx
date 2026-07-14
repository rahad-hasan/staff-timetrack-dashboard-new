import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTicketById } from "@/actions/support/action";
import TicketDetailView from "@/components/Support/TicketDetailView";
import { getDecodedUser } from "@/utils/decodedLogInUser";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Support Ticket",
  description: "View and reply to your support ticket.",
};

const TicketDetailPage = async ({ params }: TicketDetailPageProps) => {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }

  const [response, currentUser] = await Promise.all([
    getTicketById(numericId),
    getDecodedUser(),
  ]);

  if (!response?.success || !response.data) {
    notFound();
  }

  return (
    <TicketDetailView
      ticket={response.data}
      currentUser={{
        id: currentUser?.id ?? 0,
        name: currentUser?.email ?? "You",
      }}
    />
  );
};

export default TicketDetailPage;
