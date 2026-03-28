import { ISearchParamsProps } from "@/types/type";
import { getUrls } from "@/actions/appsUrls/action";
import UrlsTable from "./UrlsTable";
import { format } from "date-fns";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const UrlsTableServer = async ({ searchParams }: ISearchParamsProps) => {
  const user = await getDecodedUser();
  const userId = user?.id;
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const params = await searchParams;
  const result = await getUrls({
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
