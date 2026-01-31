import { ISearchParamsProps } from "@/types/type";
import AppNameTable from "./AppNameTable";
import { getAppsUrls } from "@/actions/appsUrls/action";
import { cookies } from "next/headers";
import { format } from "date-fns";

const AppTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const params = await searchParams;
    const currentDate = format(new Date(), "yyyy-MM-dd");
    const result = await getAppsUrls({
        date: params.date ?? currentDate,
        user_id: params.user_id ?? userId,
        project_id: params.project_id,
    });
    return (
        <>
            <AppNameTable data={result?.data?.apps} />
        </>
    );
};

export default AppTableServer;