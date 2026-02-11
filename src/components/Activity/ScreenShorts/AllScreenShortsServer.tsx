import { ISearchParamsProps } from "@/types/type";
import AllScreenShorts from "./AllScreenShorts";
import { getAllScreenshots } from "@/actions/screenshots/action";
import { format } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const AllScreenShortsServer = async ({ searchParams }: ISearchParamsProps) => {
    const user = await getDecodedUser();
    const userId = user?.id;
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const params = await searchParams;

  const result = await getAllScreenshots({
    date: params.date ?? currentDate,
    user_id: params.user_id ?? userId,
    timezone: params?.timezone,
    project_id: params?.project_id,
  });

  // console.log("All screenshots loaded", result);

  return (
    <div>

        {<AllScreenShorts data={result?.data}></AllScreenShorts>}

    </div>
  );
};

export default AllScreenShortsServer;
