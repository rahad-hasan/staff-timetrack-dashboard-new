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
} from 'lucide-react';
import TrialCart from './sidebar/TrialCart';

const SideBar = () => {
    const [openMenu, setOpenMenu] = useState<string | null>('');
    const [activeSubItem, setActiveSubItem] = useState<string>('');

    const toggleMenu = (menu: string) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
    };

    return (
        <div className=" w-[320px]  min-h-screen py-5">
            <div className=' flex items-center justify-between bg-white px-4 py-2  mx-3 rounded-2xl border-2'>
                <div className=' flex items-center gap-1.5 '>
                    <Image src={logo.src} alt="Logo" width={0} height={0} className="w-12 h-12 " />
                    <h2 className=' text-2xl font-bold'>Tracker</h2>
                </div>
                <Image src={fit.src} alt="Logo" width={0} height={0} className="w-8 h-8 " />
            </div>

            <aside className=" px-5 mt-6">
                <h2 className="text-xs uppercase text-gray-400 mb-3">Main menu</h2>

                <SidebarItem icon={LayoutDashboard} label="Dashboard" href="#" />
                <SidebarItem
                    icon={Clock4}
                    label="Timesheets"
                    collapsible
                    isOpen={openMenu === 'timesheets'}
                    onClick={() => toggleMenu('timesheets')}
                >
                </SidebarItem>

                <SidebarItem
                    icon={SquareActivity}
                    label="SquareActivity"
                    collapsible
                    isOpen={openMenu === 'SquareActivity'}
                    onClick={() => toggleMenu('SquareActivity')}
                >
                    <SubItem
                        label="Screenshot"
                        active={activeSubItem === 'Screenshot'}
                        onClick={() => setActiveSubItem('Screenshot')}
                    />
                    <SubItem
                        label="App"
                        active={activeSubItem === 'App'}
                        onClick={() => setActiveSubItem('App')}
                    />
                    <SubItem
                        label="URLs"
                        active={activeSubItem === 'URLs'}
                        onClick={() => setActiveSubItem('URLs')}
                    />
                </SidebarItem>

                <SidebarItem
                    icon={Lightbulb}
                    label="Insights"
                    collapsible
                    isOpen={openMenu === 'Lightbulb'}
                    onClick={() => toggleMenu('Lightbulb')}
                />

                <SidebarItem
                    icon={BriefcaseBusiness}
                    label="Project Management"
                    collapsible
                    isOpen={openMenu === 'project'}
                    onClick={() => toggleMenu('project')}
                />

                <SidebarItem
                    icon={BarChart}
                    label="Report"
                    collapsible
                    isOpen={openMenu === 'report'}
                    onClick={() => toggleMenu('report')}
                />

                <SidebarItem
                    icon={Users} label="Teams"
                    isOpen={openMenu === 'Teams'}
                    onClick={() => toggleMenu('Teams')}
                    href="#" />
            </aside>

            <div className=" mx-5 pt-3 border-t-2 border-borderColor">
                <h2 className="text-xs uppercase text-gray-400 mb-4">Others</h2>

                <SidebarItem
                    icon={CalendarDays}
                    label="Calendar"
                    collapsible
                    isOpen={openMenu === 'Calendar'}
                    onClick={() => toggleMenu('Calendar')}
                />

                <SidebarItem
                    icon={AlarmClock} label="Time and Attendance"
                    isOpen={openMenu === 'Time and Attendance'}
                    onClick={() => toggleMenu('Time and Attendance')}
                    href="#" />
                <SidebarItem
                    icon={Settings} label="Settings"
                    isOpen={openMenu === 'Settings'}
                    onClick={() => toggleMenu('Settings')}
                    href="#" />
            </div>

            <TrialCart></TrialCart>
        </div>
    );
};

export default SideBar;