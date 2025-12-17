import { getAllClient } from "@/api/features/clients/clientsSSRApi";
import ClientsTable from "./ClientsTable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClientTableServer = async ({ query }: any) => {
    const result = await getAllClient({
        search: query.search,
    });
    
    return (
        <ClientsTable data={result.data} />
    );
};

export default ClientTableServer;