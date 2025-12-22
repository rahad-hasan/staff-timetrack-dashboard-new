import ClientsTable from "./ClientsTable";
import { getClients } from "@/actions/clients/action";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClientTableServer = async ({ query }: any) => {
    const result = await getClients({
        search: query.search,
        project_id: query.project_id,
    });

    return (
        <ClientsTable data={result.data} />
    );
};

export default ClientTableServer;