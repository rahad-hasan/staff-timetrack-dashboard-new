import { ISearchParamsProps } from "@/types/type";
import { getAppsUrls } from "@/actions/appsUrls/action";
import UrlsTable from "./UrlsTable";
import { cookies } from "next/headers";
import { format } from "date-fns";

const UrlsTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const currentDate = format(new Date(), "yyyy-MM-dd");
    const params = await searchParams;
    const result = await getAppsUrls({
        date: params.date ?? currentDate,
        user_id: params.user_id ?? userId,
    });

    return (
        <>
            <UrlsTable data={result?.data?.urls} />
        </>
    );
};

export default UrlsTableServer;