import { getMyPayrollHistory } from "@/actions/payroll/action";
import { ISearchParamsProps } from "@/types/type";
import MyPayslipsView from "./MyPayslipsView";

const MyPayslipsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const selectedYear =
    typeof params.year === "string" && /^\d{4}$/.test(params.year)
      ? Number(params.year)
      : new Date().getFullYear();

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
