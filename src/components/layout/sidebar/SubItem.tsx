"use client";
import clsx from "clsx";
// import { GitCommitVertical } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import SubMenuIcon from "@/components/Icons/SubMenuIcon";

const itemVariants = {
  collapsed: { opacity: 0, x: -16 },
  open: { opacity: 1, x: 0 },
};

const SubItem = ({
  label,
  href,
  active = false,
  isCollapsed,
  onClick,
}: {
  label: string;
  href?: string;
  active?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}) => {
  return (
    <Link href={href ?? "#"} passHref>
      <motion.div
        variants={itemVariants}
        onClick={onClick}
        className={clsx(
          "text-base py-1.5 rounded-lg cursor-pointer flex gap-4 items-center text-headingTextColor dark:text-darkTextPrimary ",
          active
            ? "bg-[#ffffff] pl-4 border border-borderColor dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg  font-medium"
            : " pl-13 text-subTextColor hover:text-primary",
          isCollapsed && " !pl-3"
        )}
      >
        {active && !isCollapsed && <SubMenuIcon size={20} />}
        <span>{label}</span>
      </motion.div>
    </Link>
  );
};

export default SubItem;
