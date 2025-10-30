"use client"
import Image from 'next/image';
import logo from '../../assets/logo.svg'
// import fit from '../../assets/fit.svg'
// import { useEffect, useState } from 'react';
import {
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import { othersSidebarItems, sidebarItems } from '@/utils/SidebarItems';
import { useSidebarStore } from '@/store/sidebarStore';
import { usePathname } from 'next/navigation';
import SidebarItem from './sidebar/SidebarItem';
import SubItem from './sidebar/SubItem';
import TrialCart from './sidebar/TrialCart';


const SideBar = () => {
    const pathname = usePathname();
    console.log(pathname);
    const {
        openMenu,
        activeSubItem,
        isCollapsed,
        setOpenMenu,
        setActiveSubItem,
        toggleCollapse,
    } = useSidebarStore();

    console.log('isCollapsed', isCollapsed);
    console.log('openMenu', openMenu);


    return (
        <div className={`${isCollapsed ? "w-[90px]" : "w-[320px]"} min-h-screen py-5  z-50 sticky top-0 flex flex-col transition-all duration-300`}>
            <div
                className={`flex items-center justify-between bg-white dark:bg-darkPrimaryBg px-4 py-2 mx-3 rounded-2xl border-2 border-borderColor dark:border-darkBorder ${isCollapsed ? "flex-col" : "flex-row"
                    } transition-all duration-300`}
            >
                <div
                    className={`flex items-center ${isCollapsed ? "flex-col gap-0" : "gap-1.5"
                        }`}
                >
                    <Image
                        src={logo}
                        alt="Logo"
                        width={0}
                        height={0}
                        className={`w-12 h-12`}
                    />
                    {!isCollapsed && <h2 className="text-2xl font-bold dark:text-darkTextPrimary">Tracker</h2>}
                </div>

                <button
                    onClick={toggleCollapse}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkSecondaryBg transition cursor-pointer"
                >
                    {isCollapsed ? (
                        <ChevronRight className='' size={22} />
                    ) : (
                        <ChevronLeft className='' size={22} />
                    )}
                </button>
            </div>

            <div className=" px-5 mt-6">
                {!isCollapsed && (
                    <h2 className="text-xs uppercase text-gray-400 mb-3">Main menu</h2>
                )}

                {sidebarItems.map((item) => (
                    <div key={item.key}>
                        <SidebarItem
                            icon={item.icon}
                            label={item.label}
                            href={item.subItems.length > 0 ? undefined : item.key}
                            collapsible={item.collapsible}
                            isOpen={openMenu === item.key}
                            onClick={() => setOpenMenu(item.key)}
                            isCollapsed={isCollapsed}
                        >
                            {item.subItems.length > 0 && (
                                <div className={`${isCollapsed ? "absolute left-24 px-3 w-[180px] bg-white dark:bg-darkPrimaryBg shadow-2xl rounded-2xl" : "block"} py-3 mt-2 flex flex-col gap-1 transition-all duration-300`}>
                                    {item.subItems.map((subItem) => (
                                        <SubItem
                                            key={subItem.key}
                                            label={subItem.label}
                                            href={subItem.key}
                                            active={activeSubItem === subItem.key}
                                            isCollapsed={isCollapsed}
                                            onClick={() => setActiveSubItem(subItem.key)}
                                        />
                                    ))}
                                </div>
                            )}
                        </SidebarItem>
                    </div>
                ))}

            </div>

            <div className=" mx-5 pt-3 border-t-2 border-borderColor dark:border-darkBorder">
                {!isCollapsed && (
                    <h2 className="text-xs uppercase text-gray-400 mb-4">Others</h2>
                )}
                {othersSidebarItems.map((item) => (
                    <div key={item.key}>
                        <SidebarItem
                            icon={item.icon}
                            label={item.label}
                            href={item.subItems.length > 0 ? undefined : item.key}
                            collapsible={item.collapsible}
                            isOpen={openMenu === item.key}
                            onClick={() => setOpenMenu(item.key)}
                            isCollapsed={isCollapsed}
                        >
                            {item.subItems.length > 0 && (
                                <div className={`${isCollapsed ? "absolute left-24 w-[180px] bg-white dark:bg-darkPrimaryBg shadow-2xl rounded-2xl" : "block"} p-3 mt-2 flex flex-col gap-1 transition-all duration-300`}>
                                    {item?.subItems?.map((subItem) => (
                                        <SubItem
                                            key={subItem.key}
                                            label={subItem.label}
                                            href={subItem.key}
                                            active={activeSubItem === subItem.key}
                                            isCollapsed={isCollapsed}
                                            onClick={() => setActiveSubItem(subItem.key)}
                                        />
                                    ))}
                                </div>
                            )}
                        </SidebarItem>
                    </div>
                ))}
            </div>

            {!isCollapsed && <TrialCart />}
        </div>
    );
};

export default SideBar;