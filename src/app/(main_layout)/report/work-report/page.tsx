import { ISearchParamsProps } from "@/types/type";
import { redirect } from "next/navigation";

const WorkReportRedirectPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
      return;
    }

    if (value !== undefined) {
      query.set(key, String(value));
    }
  });

  redirect(
    `/report/monthly-report${query.toString() ? `?${query.toString()}` : ""}`,
  );
};

export default WorkReportRedirectPage;
