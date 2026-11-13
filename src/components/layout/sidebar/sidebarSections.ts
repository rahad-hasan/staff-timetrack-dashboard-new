import { MANAGEMENT_ROLES, hasRole } from "@/lib/roles";
import {
  employeeOthersSidebarItems,
  othersSidebarItems,
  sidebarItems,
  sidebarItemsEmployee,
} from "@/utils/SidebarItems";

export type SidebarNavItem = (typeof sidebarItems)[number];

export interface SidebarSections {
  main: readonly SidebarNavItem[];
  others: readonly SidebarNavItem[];
}

/**
 * The navigation a role sees: management roles get the full sets, everyone
 * else the employee ones. The desktop rail and the mobile sheet both read it,
 * so the two can no longer drift — the sheet used to give every role the
 * management "Others" section (leave types, holidays, payroll runs).
 */
export const sidebarSectionsFor = (role: unknown): SidebarSections => {
  const isManagement = hasRole(
    MANAGEMENT_ROLES,
    typeof role === "string" ? role : undefined,
  );
  return {
    main: isManagement ? sidebarItems : sidebarItemsEmployee,
    others: isManagement ? othersSidebarItems : employeeOthersSidebarItems,
  };
};
