"use client"
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { othersSidebarItems, sidebarItems, sidebarItemsEmployee } from "@/utils/SidebarItems";
import { useSidebarStore } from "@/store/sidebarStore";
import MobileSidebarItem from "./sidebar/MobileSidebarItem";
import MobileSubItem from "./sidebar/MobileSubItem";
import logoWithSlogan from '../../assets/logo-with-text.webp'
import logoForDark from '../../assets/logo-with-text-dark.png'
import { useLogInUserStore } from "@/store/logInUserStore";

const MobileSidebar = () => {
    const {
        openMenu,
        activeSubItem,
        setOpenMenu,
        setActiveSubItem,
    } = useSidebarStore();
    const logInUserData = useLogInUserStore(state => state.logInUserData);

    const roleBasedSidebarItems = (logInUserData?.role === 'admin' ||
        logInUserData?.role === 'manager' ||
        logInUserData?.role === 'hr') ? sidebarItems : sidebarItemsEmployee;

    return (
        <SheetContent className=" dark:bg-darkPrimaryBg">
            <SheetHeader>
                <SheetTitle>
                    <div
                        className={`flex items-center gap-2`}
                    >
                        <Image
                            src={logoWithSlogan}
                            alt="Brand logo"
                            width={120}
                            height={60}
                            className="hidden dark:block"
                        />
                        <Image
                            src={logoForDark}
                            alt="Brand logo"
                            width={120}
                            height={60}
                            className="dark:hidden"
                        />
                    </div>
                </SheetTitle>
                <div className="overflow-y-auto max-h-[calc(100vh-100px)] ml-1 pb-">
                    <div className=" mt-2">
                        <span className="text-xs uppercase text-gray-400 mb-3">Main menu</span>
                        {roleBasedSidebarItems.map((item) => (
                            <div key={item.key}>
                                <MobileSidebarItem
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.subItems.length > 0 ? undefined : item.key}
                                    collapsible={item.collapsible}
                                    isOpen={openMenu === item.key}
                                    onClick={() => setOpenMenu(item.key)}
                                >
                                    {item.subItems.length > 0 && (
                                        <div className="py-3 mt-2 flex flex-col gap-1 transition-all duration-300">
                                            {item.subItems.map((subItem) => (
                                                <MobileSubItem
                                                    key={subItem.key}
                                                    label={subItem.label}
                                                    href={subItem.key}
                                                    active={activeSubItem === subItem.key}
                                                    onClick={() => setActiveSubItem(subItem.key)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </MobileSidebarItem>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t-2 border-borderColor dark:border-darkBorder mt-4 pb-8">
                        <span className="text-xs uppercase text-gray-400 mb-4">Others</span>
                        {othersSidebarItems.map((item) => (
                            <div key={item.key}>
                                <MobileSidebarItem
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.subItems.length > 0 ? undefined : item.key}
                                    collapsible={item.collapsible}
                                    isOpen={openMenu === item.key}
                                    onClick={() => setOpenMenu(item.key)}
                                >
                                    {item.subItems.length > 0 && (
                                        <div className="p-3 mt-2 flex flex-col gap-1 transition-all duration-300">
                                            {item.subItems.map((subItem) => (
                                                <MobileSubItem
                                                    key={subItem.key}
                                                    label={subItem.label}
                                                    href={subItem.key}
                                                    active={activeSubItem === subItem.key}
                                                    onClick={() => setActiveSubItem(subItem.key)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </MobileSidebarItem>
                            </div>
                        ))}
                    </div>
                </div>
            </SheetHeader>
        </SheetContent>
    );
};

export default MobileSidebar;