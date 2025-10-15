"use client"
import Image from 'next/image';
import logo from '../../assets/logo.svg'
// import fit from '../../assets/fit.svg'
import { useState } from 'react';
import SidebarItem from './Sidebar/SidebarItem';
import SubItem from './Sidebar/SubItem';
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
import TrialCart from './Sidebar/TrialCart';

const SideBar = () => {
    const [openMenu, setOpenMenu] = useState<string | null>('');
    const [activeSubItem, setActiveSubItem] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    console.log(openMenu);
    console.log(activeSubItem);
    const toggleMenu = (menu: string) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
        setActiveSubItem('')
    };

    const sidebarItems = [
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            key: '/dashboard',
            collapsible: false,
            subItems: [],
        },
        {
            icon: Clock4,
            label: 'Timesheets',
            key: 'timesheets',
            collapsible: true,
            subItems: [
                { label: 'All timesheets', key: '/timesheets/all-timesheets' },
                { label: 'Manual requests', key: '/timesheets/manual-requests' },
            ],
        },
        {
            icon: SquareActivity,
            label: 'Activity',
            key: 'Activity',
            collapsible: true,
            subItems: [
                { label: 'Screenshot', key: '/activity/screenshorts' },
                { label: 'App', key: '/activity/app' },
                { label: 'URLs', key: '/activity/urls' },
            ],
        },
        {
            icon: Lightbulb,
            label: 'Insights',
            key: 'Lightbulb',
            collapsible: true,
            subItems: [],
        },
        {
            icon: BriefcaseBusiness,
            label: 'Project Management',
            key: 'project-management',
            collapsible: true,
            subItems: [
                { label: 'Projects', key: '/project-management/projects' },
                { label: 'Task', key: '/project-management/task' },
                { label: 'Clients', key: '/project-management/clients' },
            ],
        },
        {
            icon: BarChart,
            label: 'Report',
            key: 'report',
            collapsible: true,
            subItems: [],
        },
        {
            icon: Users,
            label: 'Teams',
            key: 'Teams',
            collapsible: false,
            subItems: [],
        },

    ];

    const othersSidebarItems = [
        {
            icon: CalendarDays,
            label: 'Calendar',
            key: 'Calendar',
            collapsible: true,
            subItems: [
                { label: 'Screenshot', key: 'Screenshot' },
                { label: 'App', key: 'App' },
                { label: 'URLs', key: 'URLs' },
            ],
        },
        {
            icon: AlarmClock,
            label: 'Time and Attendance',
            key: 'TimeAndAttendance',
            collapsible: false,
            subItems: [],
        },
        {
            icon: Settings,
            label: 'Settings',
            key: 'Settings',
            collapsible: false,
            subItems: [],
        },
    ]

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
                        src={logo}
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

            <div className=" mx-5 pt-3 border-t-2 border-borderColor">
                {!isCollapsed && (
                    <h2 className="text-xs uppercase text-gray-400 mb-4">Others</h2>
                )}
                {othersSidebarItems.map((item) => (
                    <div key={item.key}>
                        <SidebarItem
                            icon={item.icon}
                            label={item.label}
                            collapsible={item.collapsible}
                            isOpen={openMenu === item.key}
                            onClick={() => toggleMenu(item.key)}
                            isCollapsed={isCollapsed}
                        >
                            {item.subItems.length > 0 && (
                                <div className={`${isCollapsed ? "absolute left-24 bg-white shadow-2xl rounded-2xl" : "block"} p-3 mt-2 flex flex-col gap-1 transition-all duration-300`}>
                                    {item.subItems.map((subItem) => (
                                        <SubItem
                                            key={subItem.key}
                                            label={subItem.label}
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