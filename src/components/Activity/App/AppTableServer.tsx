import { ISearchParamsProps } from "@/types/type";
import AppNameTable from "./AppNameTable";
import { getAppsUrls } from "@/actions/appsUrls/action";

const AppTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getAppsUrls({
        date: params.date,
        user_id: params.user_id,
    });
    return (
        <>
            <AppNameTable data={result?.data?.apps}/>
        </>
    );
};

export default AppTableServer;