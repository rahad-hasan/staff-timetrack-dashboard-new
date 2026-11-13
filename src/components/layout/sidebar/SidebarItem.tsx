import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import SidebarCollapse from "./SidebarCollapse";
import DashboardIcon from "@/components/Icons/DashboardIcon";
// import TimeSheetsIcon from "@/components/Icons/TimeSheetsIcon";
// import ActivityIcon from "@/components/Icons/ActivityIcon";
// import InsightsIcon from "@/components/Icons/InsightsIcon";
// import ReportIcon from "@/components/Icons/ReportIcon";
// import SettingsIcon from "@/components/Icons/SettingsIcon";
// import ProjectManagementIcon from "@/components/Icons/ProjectManagementIcon";
// import TeamsIcon from "@/components/Icons/TeamsIcon";
// import LeaveManagementIcon from "@/components/Icons/LeaveManagementIcon";
// import CalendarIcon from "@/components/Icons/CalendarIcon";
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
import SupportColoredIcon from "@/components/ColoredIcon/SidebarIcon/SupportColoredIcon";
import PayrollColoredIcon from "@/components/ColoredIcon/SidebarIcon/PayrollColoredIcon";

// const iconMapping = {
//   Dashboard: DashboardIcon,
//   Timesheets: TimeSheetsIcon,
//   Activity: ActivityIcon,
//   Insights: InsightsIcon,
//   Projects: ProjectManagementIcon,
//   Report: ReportIcon,
//   Members: TeamsIcon,
//   Event: CalendarIcon,
//   Leaves: LeaveManagementIcon,
//   Settings: SettingsIcon,
// };

const coloredIconMapping = {
  Dashboard: DashboardColoredIcon,
  Timesheets: TimeSheetsColoredIcon,
  Activity: ActivityColoredIcon,
  Insights: InsightsColoredIcon,
  Projects: ProjectManagementColoredIcon,
  Report: ReportColoredIcon,
  Schedule: InsightsColoredIcon,
  Members: TeamsColoredIcon,
  Event: CalendarColoredIcon,
  Leaves: LeaveManagementColoredIcon,
  Payroll: PayrollColoredIcon,
  "My Payslips": PayrollColoredIcon,
  Support: SupportColoredIcon,
  Settings: SettingsColoredIcon,
}

/**
 * Group open/close timing, as two durations in SidebarCollapse's transition
 * order (height, then fade): the fade finishes a little ahead of the height.
 * CLOSE_MS is the longer close duration — the panel unmounts after it.
 */
const OPEN_TIMING = "duration-[250ms,200ms]";
const CLOSE_TIMING = "duration-[200ms,150ms]";
const CLOSE_MS = 200;

const SidebarItem = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: Icon,
  label,
  href,
  collapsible = false,
  isCollapsed,
  isOpen = false,
  activeMenu = false,
  subMenuActive,
  onClick,
  children,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  collapsible?: boolean;
  isCollapsed?: boolean;
  isOpen?: boolean;
  activeMenu?: boolean;
  subMenuActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {

  const IconComponent = coloredIconMapping[label as keyof typeof coloredIconMapping] || DashboardIcon; // Default to DashboardIcon if not found in mapping
  const content = (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between w-full text-base px-3 text-headingTextColor dark:text-darkTextPrimary transition-all duration-200 ease-in-out rounded-lg",
        isCollapsed ? "justify-center " : "",
        "py-2 cursor-pointer",
        activeMenu && !collapsible && "bg-[#ffffff] outline outline-borderColor dark:outline-darkBorder dark:bg-darkPrimaryBg text-headingTextColor dark:text-darkTextPrimary",
        activeMenu && collapsible && "text-primary dark:text-primary",
        isCollapsed && subMenuActive && "bg-[#ffffff] outline outline-borderColor dark:outline-darkBorder dark:bg-darkPrimaryBg"
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

      {children ? (
        <SidebarCollapse
          open={isOpen}
          exitMs={CLOSE_MS}
          className={clsx(
            "ease-[ease-in-out]",
            isOpen ? OPEN_TIMING : CLOSE_TIMING,
          )}
        >
          {children}
        </SidebarCollapse>
      ) : null}
    </div>
  );
};

export default SidebarItem;
