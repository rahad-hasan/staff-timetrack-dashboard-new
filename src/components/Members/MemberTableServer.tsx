/* eslint-disable @typescript-eslint/no-explicit-any */

import TeamsMemberTable from "./TeamsMemberTable";
import { getMembers } from "@/actions/members/membersAction";

export default async function MemberTableServer({ query }: any) {
  const result = await getMembers({
    search: query.search,
  });

  return <TeamsMemberTable data={result.data} />;
}
