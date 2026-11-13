import ClientsTableSkeleton from "@/skeleton/projectManagement/clients/ClientsTableSkeleton";

// The schedule page awaits its data before rendering anything; without this
// boundary a click on a schedule gave no feedback until the API answered.
const Loading = () => <ClientsTableSkeleton />;

export default Loading;
