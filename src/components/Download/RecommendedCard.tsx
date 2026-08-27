import type { ReactNode } from "react";

import TargetIcon from "./TargetIcon";
import type { IPlatformGroup } from "./downloadTargets";

interface IRecommendedCardProps {
  group: IPlatformGroup;
  title: string;
  children: ReactNode;
  /** Rendered beside the copy on desktop; used by the single-CTA case. */
  action?: ReactNode;
}

/** Tinted panel, icon plate and eyebrow shared by both recommended states. */
const RecommendedCard = ({
  group,
  title,
  children,
  action,
}: IRecommendedCardProps) => (
  <section
    aria-label="Recommended download"
    className="rounded-[12px] border border-primary/40 bg-primary/5 p-5 dark:bg-primary/10"
  >
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-darkPrimaryBg">
        <TargetIcon group={group} size={36}></TargetIcon>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          Recommended for your device
        </p>
        <h2 className="mt-1 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
          {title}
        </h2>
        {children}
      </div>

      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  </section>
);

export default RecommendedCard;
