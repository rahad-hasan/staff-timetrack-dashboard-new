import { ISearchParamsProps } from "@/types/type";
import { getAppsUrls } from "@/actions/appsUrls/action";
import UrlsTable from "./UrlsTable";

const UrlsTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getAppsUrls({
        date: params.date,
        user_id: params.user_id,
    });
    return (
        <>
            <UrlsTable data={result?.data?.urls}/>
        </>
    );
};

export default UrlsTableServer;