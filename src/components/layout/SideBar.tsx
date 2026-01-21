"use client"
import Image from 'next/image';
// import logo from '../../assets/logo.svg'
// import fit from '../../assets/fit.svg'
// import { useEffect, useState } from 'react';
import { othersSidebarItems, sidebarItems, sidebarItemsEmployee } from '@/utils/SidebarItems';
import { useSidebarStore } from '@/store/sidebarStore';
// import { usePathname } from 'next/navigation';
import SidebarItem from './sidebar/SidebarItem';
import SubItem from './sidebar/SubItem';
// import TrialCart from './sidebar/TrialCart';
import timerLogo from '../../assets/timerLogo.svg'
import CollapsedIcon from '../Icons/CollapsedIcon';
import clsx from 'clsx';
import React from 'react';
import { useLogInUserStore } from '@/store/logInUserStore';

const SideBar = () => {
    // const pathname = usePathname();
    // console.log(pathname);
    const {
        openMenu,
        activeMenu,
        activeSubItem,
        isCollapsed,
        setOpenMenu,
        setActiveSubItem,
        toggleCollapse,
    } = useSidebarStore();

    const logInUserData = useLogInUserStore(state => state.logInUserData);
    // console.log('isCollapsed', isCollapsed);
    // console.log('openMenu', openMenu);

    const roleBasedSidebarItems = (logInUserData?.role === 'admin' ||
        logInUserData?.role === 'manager' ||
        logInUserData?.role === 'hr') ? sidebarItems : sidebarItemsEmployee;

    return (
        <div className='sticky top-0 z-[50]'>
            <div className='overflow-y-scroll no-scrollbar scroll-smooth'>
                <div className={`${isCollapsed ? "w-[90px]" : "w-[260px]"} h-screen py-5 z-50  flex flex-col transition-all duration-300`}>
                    <div
                        className={`flex items-center justify-between bg-bgPrimary dark:bg-darkPrimaryBg  mx-4 rounded-2xl border border-borderColor dark:border-darkBorder ${isCollapsed ? "flex-col py-2 px-2" : "flex-row py-2.5 px-3"
                            } transition-all duration-300`}
                    >
                        <div
                            className={`flex items-center ${isCollapsed ? "flex-col gap-0" : "gap-1.5"
                                }`}
                        >
                            {/* <Image
                                src={logo}
                                alt="Logo"
                                width={0}
                                height={0}
                                className={`w-12 h-12`}
                            /> */}
                            <Image
                                src={timerLogo}
                                alt="Logo"
                                width={0}
                                height={0}
                                className={` ${isCollapsed ? "h-auto my-2 w-auto" : "h-10 w-10"}  bg-primary rounded-xl p-2 shadow-lg`}
                            />
                            {!isCollapsed && <h2 className="text-2xl font-bold text-headingTextColor dark:text-darkTextPrimary">Tracker</h2>}
                        </div>

                        <button
                            onClick={toggleCollapse}
                            className="p-2 rounded-lg  hover:bg-gray-100 dark:hover:bg-darkSecondaryBg text-subTextColor dark:text-darkTextPrimary transition cursor-pointer"
                        >
                            {/* {isCollapsed ? (
                                <ChevronRight className='' size={22} />
                            ) : (
                                <ChevronLeft className='' size={22} />
                            )} */}
                            <CollapsedIcon size={22}></CollapsedIcon>
                        </button>
                    </div>

                    <div className={clsx(isCollapsed ? "px-5" : "px-4", " px-4 mt-6 mb-3")}>
                        {!isCollapsed && (
                            <h2 className="text-xs uppercase text-subTextColor dark:text-darkTextSecondary mb-3">Main menu</h2>
                        )}
                        {roleBasedSidebarItems.map((item) => (
                            <div key={item.key}>
                                <SidebarItem
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.subItems.length > 0 ? undefined : item.key}
                                    collapsible={item.collapsible}
                                    isOpen={openMenu === item.key}
                                    activeMenu={activeMenu === item.key}
                                    subMenuActive={item.subItems.some(subItem => subItem.key === activeSubItem)}
                                    onClick={() => setOpenMenu(item.key)}
                                    isCollapsed={isCollapsed}
                                >
                                    {item.subItems.length > 0 && (
                                        <div className={`${isCollapsed ? "absolute left-24 px-3 w-[180px] bg-white dark:bg-darkSecondaryBg shadow-2xl rounded-2xl" : "block"} py-2.5 flex flex-col gap-1 transition-all duration-300`}>
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

                    <div className={clsx(isCollapsed ? "px-5" : "px-4", " pt-3 border-t-2 border-borderColor dark:border-darkBorder")}>
                        {!isCollapsed && (
                            <h2 className="text-xs uppercase text-subTextColor dark:text-darkTextSecondary mb-2">Others</h2>
                        )}
                        {othersSidebarItems.map((item) => (
                            <div key={item.key}>
                                <SidebarItem
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.subItems.length > 0 ? undefined : item.key}
                                    collapsible={item.collapsible}
                                    isOpen={openMenu === item.key}
                                    activeMenu={activeMenu === item.key}
                                    subMenuActive={item.subItems.some(subItem => subItem.key === activeSubItem)}
                                    onClick={() => setOpenMenu(item.key)}
                                    isCollapsed={isCollapsed}
                                >
                                    {item.subItems.length > 0 && (
                                        <div className={`${isCollapsed ? "absolute left-24 px-3 w-[180px] bg-white dark:bg-darkSecondaryBg shadow-2xl rounded-2xl" : "block"} py-2.5 flex flex-col gap-1 transition-all duration-300`}>
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

                    {/* {!isCollapsed && <TrialCart />} */}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SideBar);