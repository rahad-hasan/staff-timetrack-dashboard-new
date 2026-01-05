import HeroCartServer from "@/components/Dashboard/HeroCartServer";
import HeroHeading from "@/components/Dashboard/HeroHeading";
import DashboardHeroSkeleton from "@/skeleton/DashboardHeroSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";

export default async function Dashboard({ searchParams }: ISearchParamsProps) {
  return (
    <div>
      <HeroHeading searchParams={searchParams}></HeroHeading>
      <Suspense fallback={<DashboardHeroSkeleton />}>
        <HeroCartServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
