import {
    SquareActivity,
    BarChart,
    // Lightbulb,
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
    // {
    //     icon: Lightbulb,
    //     label: 'Insights',
    //     key: '/insights',
    //     collapsible: true,
    //     subItems: [
    //         // { label: 'Highlight', key: '/insights/highlight' },
    //         { label: 'Performance', key: '/insights/performance' },
    //         { label: 'Unusual Activity', key: '/insights/unusual-activity' },
    //     ],
    // },
    {
        icon: BriefcaseBusiness,
        label: 'Projects',
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
            // { label: 'Time & activities', key: '/report/time-and-activities' },
            { label: 'Attendance', key: '/report/attendance' },
            { label: 'Work Report', key: '/report/work-report' },
        ],
    },
    {
        icon: Users,
        label: 'Members',
        key: '/members',
        collapsible: false,
        subItems: [],
    },
    {
        icon: Users,
        label: 'Schedule',
        key: '/schedule',
        collapsible: false,
        subItems: [],
    },
];


export const sidebarItemsEmployee = [
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
        icon: BriefcaseBusiness,
        label: 'Projects',
        key: 'project-management',
        collapsible: true,
        subItems: [
            { label: 'Projects', key: '/project-management/projects' },
            { label: 'Task', key: '/project-management/task' },
        ],
    },
    {
        icon: BarChart,
        label: 'Report',
        key: 'report',
        collapsible: true,
        subItems: [
            { label: 'Timesheet', key: '/report/timesheets' },
            { label: 'Attendance', key: '/report/attendance' },
        ],
    }
];

export const othersSidebarItems = [
    {
        icon: CalendarDays,
        label: 'Event',
        key: '/event',
        collapsible: false,
        subItems: [],
    },
    {
        icon: AlarmClock,
        label: 'Leaves',
        key: '/leave-management',
        collapsible: true,
        subItems: [
            { label: 'My Leaves', key: '/leave-management/my-leaves' },
            { label: 'Leave Types', key: '/leave-management/leave-types' },
            { label: 'Holidays', key: '/leave-management/holidays' },
            { label: 'Request Queue', key: '/leave-management/request-queue' },
            { label: 'History', key: '/leave-management/history' },
            { label: 'Calendar', key: '/leave-management/calendar' },
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

export const employeeOthersSidebarItems = [
    {
        icon: CalendarDays,
        label: 'Event',
        key: '/event',
        collapsible: false,
        subItems: [],
    },
    {
        icon: AlarmClock,
        label: 'Leaves',
        key: '/leave-management',
        collapsible: true,
        subItems: [
            { label: 'My Leaves', key: '/leave-management/my-leaves' },
            { label: 'History', key: '/leave-management/history' },
            { label: 'Calendar', key: '/leave-management/calendar' },
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
