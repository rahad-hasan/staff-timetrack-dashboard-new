"use client";

import Link from "next/link";
import { useSidebarStore } from "@/store/sidebarStore";

interface LinkWithActiveNavProps {
  url: string;
  openMenu: string | null;
  activeSubItem: string;
  children: React.ReactNode;
}

const LinkWithActiveNav = ({
  url,
  openMenu,
  activeSubItem,
  children,
}: LinkWithActiveNavProps) => {

  const {
    setOpenMenu,
    setActiveSubItem,
  } = useSidebarStore();

  const handleOnClick = () => {
    setOpenMenu(openMenu)
    setActiveSubItem(activeSubItem)
  }

  return (
    <Link onClick={handleOnClick} href={url} className="block">
      {children}
    </Link>
  );
};

export default LinkWithActiveNav;
