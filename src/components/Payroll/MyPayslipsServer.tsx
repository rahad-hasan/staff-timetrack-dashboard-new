import { getMyPayrollHistory } from "@/actions/payroll/action";
import { getViewerTimeZone } from "@/lib/server/session";
import { todayIn } from "@/lib/timezone";
import { ISearchParamsProps } from "@/types/type";
import MyPayslipsView from "./MyPayslipsView";

const MyPayslipsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  // The viewer's year by default: the process's own clock is another zone's
  // year around New Year.
  const selectedYear =
    typeof params.year === "string" && /^\d{4}$/.test(params.year)
      ? Number(params.year)
      : Number(todayIn(await getViewerTimeZone(), "yyyy"));

  const response = await getMyPayrollHistory({
    year: selectedYear,
    limit: 24,
  });

  const items = response?.success && Array.isArray(response.data)
    ? response.data
    : [];

  return <MyPayslipsView items={items} selectedYear={selectedYear} />;
};

export default MyPayslipsServer;
