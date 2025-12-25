/* eslint-disable @typescript-eslint/no-explicit-any */

import AppPagination from "../Common/AppPagination";
import TeamsMemberTable from "./TeamsMemberTable";
import { getMembers } from "@/actions/members/action";

export default async function MemberTableServer({ query }: any) {
  const result = await getMembers({
    search: query.search,
    page: query.page,
  });

  return <>
    <TeamsMemberTable data={result?.data} />
    <AppPagination
      total={result?.meta?.total ?? 1}
      currentPage={query.page}
      limit={result?.meta?.limit ?? 10}
    />
  </>
}
