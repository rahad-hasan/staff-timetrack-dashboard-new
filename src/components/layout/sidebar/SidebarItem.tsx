import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import DashboardIcon from "@/components/Icons/DashboardIcon";
import TimeSheetsIcon from "@/components/Icons/TimeSheetsIcon";
import ActivityIcon from "@/components/Icons/ActivityIcon";
import InsightsIcon from "@/components/Icons/InsightsIcon";
import ReportIcon from "@/components/Icons/ReportIcon";
import SettingsIcon from "@/components/Icons/SettingsIcon";
import ProjectManagementIcon from "@/components/Icons/ProjectManagementIcon";
import TeamsIcon from "@/components/Icons/TeamsIcon";
import LeaveManagementIcon from "@/components/Icons/LeaveManagementIcon";
import CalendarIcon from "@/components/Icons/CalendarIcon";
import DashboardColoredIcon from "@/components/ColoredIcon/SidebarIcon/DashboardColoredIcon";
import TimeSheetsColoredIcon from "@/components/ColoredIcon/SidebarIcon/TimeSheetsColoredIcon";
import ActivityColoredIcon from "@/components/ColoredIcon/SidebarIcon/ActivityColoredIcon";
import InsightsColoredIcon from "@/components/ColoredIcon/SidebarIcon/InsightsColoredIcon";
import ProjectManagementColoredIcon from "@/components/ColoredIcon/SidebarIcon/ProjectManagementColoredIcon";
import ReportColoredIcon from "@/components/ColoredIcon/SidebarIcon/ReportColoredIcon";
import TeamsColoredIcon from "@/components/ColoredIcon/SidebarIcon/TeamsColoredIcon";
import CalendarColoredIcon from "@/components/ColoredIcon/SidebarIcon/CalendarColoredIcon";
import LeaveManagementColoredIcon from "@/components/ColoredIcon/SidebarIcon/LeaveManagementColoredIcon";
import SettingsColoredIcon from "@/components/ColoredIcon/SidebarIcon/SettingsColoredIcon";

const iconMapping = {
  Dashboard: DashboardIcon,
  Timesheets: TimeSheetsIcon,
  Activity: ActivityIcon,
  Insights: InsightsIcon,
  Projects: ProjectManagementIcon,
  Report: ReportIcon,
  Members: TeamsIcon,
  Calendar: CalendarIcon,
  Leaves: LeaveManagementIcon,
  Settings: SettingsIcon,
};

const coloredIconMapping = {
  Dashboard: DashboardColoredIcon,
  Timesheets: TimeSheetsColoredIcon,
  Activity: ActivityColoredIcon,
  Insights: InsightsColoredIcon,
  Projects: ProjectManagementColoredIcon,
  Report: ReportColoredIcon,
  Members: TeamsColoredIcon,
  Calendar: CalendarColoredIcon,
  Leaves: LeaveManagementColoredIcon,
  Settings: SettingsColoredIcon,
}

const containerVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.15 },
    },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.25 },
      opacity: { duration: 0.2 },
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  collapsible = false,
  isCollapsed,
  isOpen = false,
  onClick,
  children,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  collapsible?: boolean;
  isCollapsed?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {

  const IconComponent = coloredIconMapping[label as keyof typeof coloredIconMapping] || DashboardIcon; // Default to DashboardIcon if not found in mapping
  const content = (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between w-full px-3 text-base text-headingTextColor dark:text-darkTextPrimary dark:hover:text-primary hover:text-primary transition-all duration-200 ease-in-out",
        isCollapsed ? "justify-center" : "",
        "py-2 cursor-pointer",
        isOpen && !collapsible && "bg-[#E9F8F0] text-headingTextColor dark:text-darkTextPrimary shadow rounded-lg",
        isOpen && collapsible && "text-primary dark:text-primary",
      )}
    >
      <div className={clsx("flex items-center gap-2")}>
        <IconComponent size={32} />
        {!isCollapsed && <span>{label}</span>}
      </div>
      {!isCollapsed && collapsible && (
        <div>{isOpen ? <Minus size={18} /> : <Plus size={18} />}</div>
      )}
    </div>
  );

  return (
    <div className="mb-0.5">
      {href ? <Link href={href}>{content}</Link> : content}

      <AnimatePresence initial={false}>
        {isOpen && children && (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="collapsed"
            animate="open"
            exit="collapsed"
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarItem;
