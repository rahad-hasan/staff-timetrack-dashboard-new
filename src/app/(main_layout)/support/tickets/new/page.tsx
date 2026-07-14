import { Metadata } from "next";
import CreateTicketForm from "@/components/Support/CreateTicketForm";

export const metadata: Metadata = {
  title: "Create Support Ticket",
  description: "Send a new support ticket to the team.",
};

const NewTicketPage = () => <CreateTicketForm />;

export default NewTicketPage;
