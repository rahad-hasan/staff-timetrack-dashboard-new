import HeroCart from "@/components/Dashboard/HeroCart";
import HeroHeading from "@/components/Dashboard/HeroHeading";
import DashboardHeroSkeleton from "@/skeleton/DashboardHeroSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Suspense } from "react";

export default function Dashboard({ searchParams }: ISearchParamsProps) {
  return (
    <div>
      <Suspense>
        <HeroHeading searchParams={searchParams}></HeroHeading>
      </Suspense>
      <Suspense fallback={<DashboardHeroSkeleton />}>
        <HeroCart searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
