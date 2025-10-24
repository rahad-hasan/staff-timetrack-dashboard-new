"use client"
import Image from 'next/image';
import logo from '../../assets/logo.svg'
// import fit from '../../assets/fit.svg'
import { useState } from 'react';
import SidebarItem from './Sidebar/SidebarItem';
import SubItem from './Sidebar/SubItem';
import {
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import TrialCart from './Sidebar/TrialCart';
import { othersSidebarItems, sidebarItems } from '@/utils/SidebarItems';

const SideBar = () => {
    const [openMenu, setOpenMenu] = useState<string | null>('');
    const [activeSubItem, setActiveSubItem] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const toggleMenu = (menu: string) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
        setActiveSubItem('')
    };

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

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                    {isCollapsed ? (
                        <ChevronRight size={22} />
                    ) : (
                        <ChevronLeft size={22} />
                    )}
                </button>
            </div>

            <aside className=" px-5 mt-6">
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
                            onClick={() => toggleMenu(item.key)}
                            isCollapsed={isCollapsed}
                        >
                            {item.subItems.length > 0 && (
                                <div className={`${isCollapsed ? "absolute left-24 px-3 w-[180px] bg-white shadow-2xl rounded-2xl" : "block"} py-3 mt-2 flex flex-col gap-1 transition-all duration-300`}>
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

            </aside>

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
                            onClick={() => toggleMenu(item.key)}
                            isCollapsed={isCollapsed}
                        >
                            {item.subItems.length > 0 && (
                                <div className={`${isCollapsed ? "absolute left-24 bg-white shadow-2xl rounded-2xl" : "block"} p-3 mt-2 flex flex-col gap-1 transition-all duration-300`}>
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