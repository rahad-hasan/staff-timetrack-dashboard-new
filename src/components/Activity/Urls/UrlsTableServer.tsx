import { ISearchParamsProps } from "@/types/type";
import { getUrls } from "@/actions/appsUrls/action";
import UrlsTable from "./UrlsTable";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const UrlsTableServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const { userId, date } = await resolveViewFilters(params);
  const result = await getUrls({
    date,
    user_id: userId,
    // The page's project picker writes this; GET /apps-url/urls filters on it
    // exactly like /apps-url/apps does.
    project_id: params.project_id,
  });
  // A refusal (no access to the member, no such member) keeps the empty
  // table; any other failure throws rather than passing for "no URLs".
  requireDataOrRefusal(result, "URL usage");

  return (
    <>
      <UrlsTable
        data={result?.data?.urls}
        message={result?.success === false ? result.message : undefined}
      />
    </>
  );
};

export default UrlsTableServer;
