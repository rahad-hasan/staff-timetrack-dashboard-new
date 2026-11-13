"use client";
import type { CSSProperties } from "react";
import clsx from "clsx";
// import { GitCommitVertical } from "lucide-react";
import Link from "next/link";
import SubMenuIcon from "@/components/Icons/SubMenuIcon";

/** First item's delay and the step between items when a group opens. */
const STAGGER_START_MS = 30;
const STAGGER_STEP_MS = 60;

const SubItem = ({
  label,
  href,
  active = false,
  isCollapsed,
  index = 0,
  onClick,
}: {
  label: string;
  href?: string;
  active?: boolean;
  isCollapsed?: boolean;
  /** Position in the group; drives the slide-in stagger. */
  index?: number;
  onClick?: () => void;
}) => {
  return (
    <Link href={href ?? "#"} passHref>
      <div
        onClick={onClick}
        style={
          {
            "--sub-item-delay": `${STAGGER_START_MS + index * STAGGER_STEP_MS}ms`,
          } as CSSProperties
        }
        className={clsx(
          "text-base py-1.5 mx-0.5 rounded-lg cursor-pointer flex gap-4 items-center text-headingTextColor dark:text-darkTextPrimary ",
          // Slides in from the left one after another when its group opens
          // (SidebarCollapse's data attributes), and fades out with it.
          "transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
          "starting:group-data-[enter]/collapse:-translate-x-4 starting:group-data-[enter]/collapse:opacity-0",
          "group-data-[state=open]/collapse:[transition-delay:var(--sub-item-delay)]",
          "group-data-[state=closed]/collapse:-translate-x-4 group-data-[state=closed]/collapse:opacity-0",
          active
            ? "bg-[#ffffff] pl-4 outline outline-borderColor dark:outline-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg  font-medium"
            : " pl-13 text-subTextColor hover:text-primary",
          isCollapsed && " !pl-3"
        )}
      >
        {active && !isCollapsed && <SubMenuIcon size={20} />}
        <span>{label}</span>
      </div>
    </Link>
  );
};

export default SubItem;
