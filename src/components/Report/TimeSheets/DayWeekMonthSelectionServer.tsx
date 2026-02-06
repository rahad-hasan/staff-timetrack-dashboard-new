import { ISearchParamsProps } from "@/types/type";
import ReportDailyTimeSheet from "./ReportDailyTimeSheet";
import { getTimeEntry } from "@/actions/report/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { format } from "date-fns";

const DayWeekMonthSelectionServer = async ({
  searchParams,
}: ISearchParamsProps) => {
  const params = await searchParams;
  const user = await getDecodedUser();
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const res = await getTimeEntry({
    date: params.date ?? currentDate,
    user_id: params.user_id ?? user?.id,
    timezone: params?.timezone,
  });

  return (
    <div>
      <ReportDailyTimeSheet
        dailyTimeEntry={res?.data}
      ></ReportDailyTimeSheet>
    </div>
  );
};

export default DayWeekMonthSelectionServer;
