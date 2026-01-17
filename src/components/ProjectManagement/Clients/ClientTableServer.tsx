import AppPagination from "@/components/Common/AppPagination";
import ClientsTable from "./ClientsTable";
import { getClients } from "@/actions/clients/action";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClientTableServer = async ({ query }: any) => {
    const result = await getClients({
        search: query.search,
        project_id: query.project_id,
        page: query.page,
    });

    return (
        <>
            <ClientsTable data={result.data} />
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={query.page}
                limit={result?.meta?.limit ?? 10}
            />
        </>
    );
};

export default ClientTableServer;