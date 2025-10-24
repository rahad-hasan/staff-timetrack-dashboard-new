"use client"
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import Image from "next/image";
import logo from '../../assets/logo.svg'
import { othersSidebarItems, sidebarItems } from "@/utils/SidebarItems";
import { useState } from "react";
import MobileSubItem from "./Sidebar/MobileSubItem";
import MobileSidebarItem from "./Sidebar/MobileSidebarItem";

const MobileSidebar = () => {
    const [openMenu, setOpenMenu] = useState<string | null>('');
    const [activeSubItem, setActiveSubItem] = useState<string>('');

    const toggleMenu = (menu: string) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
        setActiveSubItem('')
    };
    return (
        <SheetContent>
            <SheetHeader>
                <SheetTitle>
                    <div
                        className={`flex items-center `}
                    >
                        <Image
                            src={logo}
                            alt="Logo"
                            width={0}
                            height={0}
                            className={`w-10 h-10`}
                        />
                        <h2 className="text-xl font-bold">Tracker</h2>
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
                                    onClick={() => toggleMenu(item.key)}
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
                                    onClick={() => toggleMenu(item.key)}
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