import { ISearchParamsProps } from "@/types/type";
import AppNameTable from "./AppNameTable";
import { getApps } from "@/actions/appsUrls/action";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const AppTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const { userId, date } = await resolveViewFilters(params);
    const result = await getApps({
        date,
        user_id: userId,
        project_id: params.project_id,
    });
    // A refusal (no access to the member, no such member) keeps the empty
    // table; any other failure throws rather than passing for "no apps".
    requireDataOrRefusal(result, "app usage");
    return (
        <>
            <AppNameTable
                data={result?.data?.apps}
                message={result?.success === false ? result.message : undefined}
            />
        </>
    );
};

export default AppTableServer;
