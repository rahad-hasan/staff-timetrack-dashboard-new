"use client"
import Image from 'next/image';
import logo from '../../assets/logo.svg'
import fit from '../../assets/fit.svg'
import { useState } from 'react';
import SidebarItem from './sidebar/SidebarItem';
import SubItem from './sidebar/SubItem';
import {
    SquareActivity,
    BarChart,
    Lightbulb,
    BriefcaseBusiness,
    LayoutDashboard,
    Clock4,
    Users,
    CalendarDays,
    AlarmClock,
    Settings,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import TrialCart from './sidebar/TrialCart';

const SideBar = () => {
    const [openMenu, setOpenMenu] = useState<string | null>('');
    const [activeSubItem, setActiveSubItem] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleMenu = (menu: string) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
    };

    return (
        <div className={`${isCollapsed ? "w-[90px]" : "w-[320px]"} min-h-screen py-5  z-50 sticky top-0 flex flex-col transition-all duration-300`}>
            <div
                className={`flex items-center justify-between bg-white px-4 py-2 mx-3 rounded-2xl border-2 ${isCollapsed ? "flex-col" : "flex-row"
                    } transition-all duration-300`}
            >
                <div
                    className={`flex items-center ${isCollapsed ? "flex-col gap-0" : "gap-1.5"
                        }`}
                >
                    <Image
                        src={logo.src}
                        alt="Logo"
                        width={0}
                        height={0}
                        className={`w-12 h-12`}
                    />
                    {!isCollapsed && <h2 className="text-2xl font-bold">Tracker</h2>}
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

                <SidebarItem icon={LayoutDashboard} label="Dashboard" href="#" isCollapsed={isCollapsed} />
                <SidebarItem
                    icon={Clock4}
                    label="Timesheets"
                    collapsible
                    isOpen={openMenu === 'timesheets'}
                    onClick={() => toggleMenu('timesheets')}
                    isCollapsed={isCollapsed}
                >
                </SidebarItem>

                <SidebarItem
                    icon={SquareActivity}
                    label="SquareActivity"
                    collapsible
                    isOpen={openMenu === 'SquareActivity'}
                    onClick={() => toggleMenu('SquareActivity')}
                    isCollapsed={isCollapsed}
                >
                    <div className={`${isCollapsed ? " absolute left-24 bg-white shadow-2xl rounded-2xl" : "block"} p-3 mt-2 flex flex-col gap-1  transition-all duration-300`}>
                        <SubItem
                            label="Screenshot"
                            active={activeSubItem === 'Screenshot'}
                            isCollapsed={isCollapsed}
                            onClick={() => setActiveSubItem('Screenshot')}
                        />
                        <SubItem
                            label="App"
                            active={activeSubItem === 'App'}
                            isCollapsed={isCollapsed}
                            onClick={() => setActiveSubItem('App')}
                        />
                        <SubItem
                            label="URLs"
                            active={activeSubItem === 'URLs'}
                            isCollapsed={isCollapsed}
                            onClick={() => setActiveSubItem('URLs')}
                        />
                    </div>
                </SidebarItem>

                <SidebarItem
                    icon={Lightbulb}
                    label="Insights"
                    collapsible
                    isOpen={openMenu === 'Lightbulb'}
                    onClick={() => toggleMenu('Lightbulb')}
                    isCollapsed={isCollapsed}
                />

                <SidebarItem
                    icon={BriefcaseBusiness}
                    label="Project Management"
                    collapsible
                    isOpen={openMenu === 'project'}
                    onClick={() => toggleMenu('project')}
                    isCollapsed={isCollapsed}
                />

                <SidebarItem
                    icon={BarChart}
                    label="Report"
                    collapsible
                    isOpen={openMenu === 'report'}
                    onClick={() => toggleMenu('report')}
                    isCollapsed={isCollapsed}
                />

                <SidebarItem
                    icon={Users} label="Teams"
                    isOpen={openMenu === 'Teams'}
                    onClick={() => toggleMenu('Teams')}
                    href="#"
                    isCollapsed={isCollapsed}
                />

            </aside>

            <div className=" mx-5 pt-3 border-t-2 border-borderColor">
                {!isCollapsed && (
                    <h2 className="text-xs uppercase text-gray-400 mb-4">Others</h2>
                )}
                <SidebarItem
                    icon={CalendarDays}
                    label="Calendar"
                    collapsible
                    isOpen={openMenu === 'Calendar'}
                    onClick={() => toggleMenu('Calendar')}
                    isCollapsed={isCollapsed}
                />

                <SidebarItem
                    icon={AlarmClock} label="Time and Attendance"
                    isOpen={openMenu === 'Time and Attendance'}
                    onClick={() => toggleMenu('Time and Attendance')}
                    href="#"
                    isCollapsed={isCollapsed}
                />
                <SidebarItem
                    icon={Settings} label="Settings"
                    isOpen={openMenu === 'Settings'}
                    onClick={() => toggleMenu('Settings')}
                    href="#"
                    isCollapsed={isCollapsed}
                />
            </div>

            {!isCollapsed && <TrialCart />}
        </div>
    );
};

export default SideBar;