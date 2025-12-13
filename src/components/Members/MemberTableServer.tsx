/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllMember } from "@/api/features/members/memberSSRApi";
import TeamsMemberTable from "./TeamsMemberTable";

export default async function MemberTableServer({ query }: any) {
  const result = await getAllMember({
    search: query.search,
  });

  return <TeamsMemberTable data={result.data} />;
}
