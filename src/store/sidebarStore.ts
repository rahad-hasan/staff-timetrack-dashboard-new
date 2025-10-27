import { othersSidebarItems, sidebarItems } from "@/utils/SidebarItems";
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
                // these are initial state
                openMenu: null,
                activeSubItem: "",
                isCollapsed: false,

                // these are function to change state
                setOpenMenu: (menu) =>
                    set((state) => ({
                        openMenu: state.openMenu === menu ? null : menu,
                        activeSubItem: "",
                    })),

                setActiveSubItem: (subItem) => set({ activeSubItem: subItem }),

                toggleCollapse: () =>
                    set((state) => ({ isCollapsed: !state.isCollapsed })),
                
                syncSidebarWithPath: (pathname:string) => {
                    const allMenus = [...sidebarItems, ...othersSidebarItems];

                    let matchedMenu: string | null = null;
                    let matchedSubItem = "";

                    for (const menu of allMenus) {
                        if (menu.subItems?.length > 0) {
                            const match = menu.subItems.find((sub) => pathname.includes(sub.key));
                            if (match) {
                                matchedMenu = menu.key;
                                matchedSubItem = match.key;
                                break;
                            }
                        } else if (pathname.includes(menu.key)) {
                            matchedMenu = menu.key;
                            matchedSubItem = menu.key;
                            break;
                        }
                    }

                    set({
                        openMenu: matchedMenu,
                        activeSubItem: matchedSubItem,
                    });
                },
                resetSidebar: () =>
                    set({ openMenu: null, activeSubItem: "", isCollapsed: false }),
            }),

            {
                name: "sidebar-storage", // localStorage key
            }
        )
    )
);
