import ClientsTable from "./ClientsTable";
import { getClients } from "@/actions/clients/action";

// The API returns every client in one response (it takes no page or search
// parameters), so there is nothing to paginate and nothing in the URL to read.
const ClientTableServer = async () => {
    const result = await getClients();

    return <ClientsTable data={result?.data} />;
};

export default ClientTableServer;
