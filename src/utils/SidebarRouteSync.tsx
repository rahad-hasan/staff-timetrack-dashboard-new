/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSidebarStore } from "@/store/sidebarStore";

export const SidebarRouteSync = () => {
  const pathname = usePathname();
  const syncSidebarWithPath = useSidebarStore((s) => (s as any).syncSidebarWithPath);

  useEffect(() => {
    // Automatically sync Zustand with current route
    syncSidebarWithPath(pathname);
  }, [pathname, syncSidebarWithPath]);

  return null; // invisible helper
};
