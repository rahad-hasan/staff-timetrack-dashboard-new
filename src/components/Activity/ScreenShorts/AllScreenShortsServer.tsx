import { ISearchParamsProps } from "@/types/type";
import AllScreenShorts from "./AllScreenShorts";
import { getAllScreenshots } from "@/actions/screenshots/action";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const AllScreenShortsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const { userId, date } = await resolveViewFilters(params);

  const result = await getAllScreenshots({
    date,
    user_id: userId,
    timezone: params?.timezone,
    project_id: params?.project_id,
  });
  // A refusal (no access to the member, no such member, a plan that no longer
  // admits the read) keeps the empty grid; any other failure throws. It has
  // no `data`, so the grid is handed an empty list and the API's reason.
  requireDataOrRefusal(result, "the screenshots");

  return (
    <div>

        {<AllScreenShorts
          data={result?.data ?? []}
          message={result?.success === false ? result.message : undefined}
        ></AllScreenShorts>}

    </div>
  );
};

export default AllScreenShortsServer;
