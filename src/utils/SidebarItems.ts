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

export const sidebarItems = [
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
        key: '/insights',
        collapsible: true,
        subItems: [
            { label: 'Highlight', key: '/insights/highlight' },
        ],
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
        subItems: [
            { label: 'Timesheet', key: '/report/timesheets' },
            { label: 'Time & activities', key: '/report/time-and-activities' },
            { label: 'Attendance', key: '/report/attendance' },
        ],
    },
    {
        icon: Users,
        label: 'Teams',
        key: '/teams',
        collapsible: false,
        subItems: [],
    },

];

export const othersSidebarItems = [
    {
        icon: CalendarDays,
        label: 'Calendar',
        key: '/calender',
        collapsible: false,
        subItems: [],
    },
    {
        icon: AlarmClock,
        label: 'Leave Management',
        key: '/leave-management',
        collapsible: true,
        subItems: [
            { label: 'Leave details', key: '/leave-management/leave-details' },
            { label: 'Leave request', key: '/leave-management/leave-request' },
        ],
    },
    {
        icon: Settings,
        label: 'Settings',
        key: '/settings',
        collapsible: false,
        subItems: [],
    },
]