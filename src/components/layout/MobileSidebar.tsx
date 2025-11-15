"use client"
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
// import logo from '../../assets/logo.svg';
import { othersSidebarItems, sidebarItems } from "@/utils/SidebarItems";
import { useSidebarStore } from "@/store/sidebarStore";
import MobileSidebarItem from "./sidebar/MobileSidebarItem";
import MobileSubItem from "./sidebar/MobileSubItem";
import timerLogo from '../../assets/timerLogo.svg';

const MobileSidebar = () => {
    const {
        openMenu,
        activeSubItem,
        setOpenMenu,
        setActiveSubItem,
    } = useSidebarStore();

    return (
        <SheetContent className=" dark:bg-darkPrimaryBg">
            <SheetHeader>
                <SheetTitle>
                    <div
                        className={`flex items-center gap-2`}
                    >
                        {/* <Image
                            src={logo}
                            alt="Logo"
                            width={0}
                            height={0}
                            className={`w-10 h-10`}
                        />
                        <h2 className="text-xl font-bold text-headingTextColor dark:text-darkTextPrimary">Tracker</h2> */}
                        <Image
                            src={timerLogo}
                            alt="Logo"
                            width={100}
                            height={100}
                            className={`h-10 w-10 bg-primary rounded-xl p-2 shadow-lg`}
                        />
                        <h2 className="text-2xl font-bold text-headingTextColor dark:text-darkTextPrimary">Tracker</h2>
                    </div>
                </SheetTitle>
                <div className="overflow-y-auto max-h-[calc(100vh-100px)] ml-1 pb-">
                    <div className=" mt-2">
                        <span className="text-xs uppercase text-gray-400 mb-3">Main menu</span>
                        {sidebarItems.map((item) => (
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

                    <div className="pt-3 border-t-2 border-borderColor mt-4 pb-8">
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