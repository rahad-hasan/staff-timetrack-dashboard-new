import ClientsTable from "./ClientsTable";
import { getClients } from "@/actions/clients/clientsAction";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClientTableServer = async ({ query }: any) => {
    const result = await getClients({
        search: query.search,
    });
    
    return (
        <ClientsTable data={result.data} />
    );
};

export default ClientTableServer;