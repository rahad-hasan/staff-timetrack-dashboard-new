import { ISearchParamsProps } from "@/types/type";
import AppNameTable from "./AppNameTable";
import { getAppsUrls } from "@/actions/appsUrls/action";
import { cookies } from "next/headers";

const AppTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const params = await searchParams;
    const result = await getAppsUrls({
        date: params.date,
        user_id: params.user_id ?? userId,
    });
    return (
        <>
            <AppNameTable data={result?.data?.apps} />
        </>
    );
};

export default AppTableServer;