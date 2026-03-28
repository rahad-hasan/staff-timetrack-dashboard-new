import { ISearchParamsProps } from "@/types/type";
import AppNameTable from "./AppNameTable";
import { getApps } from "@/actions/appsUrls/action";
import { format } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const AppTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const user = await getDecodedUser();
    const userId = user?.id;
    const params = await searchParams;
    const currentDate = format(new Date(), "yyyy-MM-dd");
    const result = await getApps({
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