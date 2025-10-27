import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";


interface SidebarState {
  openMenu: string | null;
  activeSubItem: string;
  isCollapsed: boolean;
  setOpenMenu: (menu: string | null) => void;
  setActiveSubItem: (subItem: string) => void;
  toggleCollapse: () => void;
  resetSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set, get) => ({
        openMenu: null,
        activeSubItem: "",
        isCollapsed: false,

        setOpenMenu: (menu) =>
          set((state) => ({
            openMenu: state.openMenu === menu ? null : menu,
            activeSubItem: "",
          })),

        setActiveSubItem: (subItem) => set({ activeSubItem: subItem }),

        toggleCollapse: () =>
          set((state) => ({ isCollapsed: !state.isCollapsed })),

        resetSidebar: () =>
          set({ openMenu: null, activeSubItem: "", isCollapsed: false }),
      }),
      {
        name: "sidebar-storage", // localStorage key
      }
    )
  )
);
