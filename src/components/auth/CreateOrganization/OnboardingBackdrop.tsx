import Image from "next/image";
import {
  Bell,
  CirclePlay,
  Clock,
  Download,
  MoreVertical,
  Plus,
  Search,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";

import DashboardColoredIcon from "@/components/ColoredIcon/SidebarIcon/DashboardColoredIcon";
import TimeSheetsColoredIcon from "@/components/ColoredIcon/SidebarIcon/TimeSheetsColoredIcon";
import ActivityColoredIcon from "@/components/ColoredIcon/SidebarIcon/ActivityColoredIcon";
import InsightsColoredIcon from "@/components/ColoredIcon/SidebarIcon/InsightsColoredIcon";
import ProjectManagementColoredIcon from "@/components/ColoredIcon/SidebarIcon/ProjectManagementColoredIcon";
import ReportColoredIcon from "@/components/ColoredIcon/SidebarIcon/ReportColoredIcon";
import TeamsColoredIcon from "@/components/ColoredIcon/SidebarIcon/TeamsColoredIcon";
import CalendarColoredIcon from "@/components/ColoredIcon/SidebarIcon/CalendarColoredIcon";
import LeaveManagementColoredIcon from "@/components/ColoredIcon/SidebarIcon/LeaveManagementColoredIcon";
import PayrollColoredIcon from "@/components/ColoredIcon/SidebarIcon/PayrollColoredIcon";
import SupportColoredIcon from "@/components/ColoredIcon/SidebarIcon/SupportColoredIcon";
import SettingsColoredIcon from "@/components/ColoredIcon/SidebarIcon/SettingsColoredIcon";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
import CollapsedIcon from "@/components/Icons/CollapsedIcon";
import logoWithText from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";
import { cn } from "@/lib/utils";

/**
 * The blurred dashboard behind the create-organization wizard.
 *
 * This is a deliberate re-creation of the real dashboard shell, class for
 * class, not an impression of it. The structure is copied from
 * `app/(main_layout)/layout.tsx`, `layout/SideBar.tsx`, `layout/Header.tsx`,
 * `Billing/TrialBanner.tsx`, `Dashboard/SampleDataBanner.tsx` and
 * `dashboard/@topCart`, and the sidebar and stat-card glyphs are the SAME icon
 * components the app renders — so the tile colours cannot drift from the real
 * nav.
 *
 * Three details carry most of the resemblance, and an earlier version got all
 * three wrong:
 *   - the sidebar has NO background or right border; it is transparent over
 *     the page's `bg-bgSecondary`, and only the logo block is a white card;
 *   - the main column is not flush — it is a bordered, `rounded-[8px]` panel
 *     with `my-3 mr-3`, so there is a visible grey gutter down the right-hand
 *     side and along the top and bottom;
 *   - body padding is `p-5`, and the trial strip sits INSIDE the panel between
 *     the header and that padding.
 *
 * It is drawn rather than screenshotted on purpose: one image cannot follow the
 * theme (it would be a light-mode picture behind a dark-mode dialog), a real
 * capture would bake someone's names and hours into a public page, it would go
 * stale the first time the dashboard changed, and it would ship a few hundred
 * KB on a page whose entire job is a form.
 *
 * Entirely decorative: `aria-hidden` and `pointer-events-none`. Every figure is
 * invented and blurred past legibility — they exist to give the shapes
 * realistic proportions, nothing more. No scrim of its own: `DialogOverlay`
 * already paints `black/50`, and a second dim layer crushed this to flat grey.
 */

type IconComponent = ({ size }: { size: number }) => React.JSX.Element;

type NavItem = {
  Icon: IconComponent;
  label: string;
  /** The live sidebar shows a "+" on sections that expand into sub-pages. */
  collapsible?: boolean;
};

/* Order and icons mirror `utils/SidebarItems.ts` for the admin role; the tile
   colours live inside the icon components themselves, so they cannot drift. */
const MAIN_NAV: ReadonlyArray<NavItem> = [
  { Icon: DashboardColoredIcon, label: "Dashboard" },
  { Icon: TimeSheetsColoredIcon, label: "Timesheets", collapsible: true },
  { Icon: ActivityColoredIcon, label: "Activity", collapsible: true },
  { Icon: InsightsColoredIcon, label: "Insights", collapsible: true },
  { Icon: ProjectManagementColoredIcon, label: "Projects", collapsible: true },
  { Icon: ReportColoredIcon, label: "Report", collapsible: true },
  { Icon: TeamsColoredIcon, label: "Members" },
  { Icon: InsightsColoredIcon, label: "Schedule" },
];

const OTHER_NAV: ReadonlyArray<NavItem> = [
  { Icon: CalendarColoredIcon, label: "Event" },
  { Icon: LeaveManagementColoredIcon, label: "Leaves", collapsible: true },
  { Icon: PayrollColoredIcon, label: "Payroll", collapsible: true },
  { Icon: SupportColoredIcon, label: "Support" },
  { Icon: SettingsColoredIcon, label: "Settings" },
];

const STATS: ReadonlyArray<{ Icon: IconComponent; value: string; label: string; change: string }> = [
  { Icon: WeeklyActivityColoredIcon, value: "78%", label: "Daily Activity", change: "+5.2%" },
  { Icon: WeeklyWorkColoredIcon, value: "05:24:36", label: "Daily Work", change: "+1.2h" },
  { Icon: TotalProjectColoredIcon, value: "4", label: "Total Projects", change: "+1.0" },
  { Icon: TeamMemberColoredIcon, value: "5", label: "Team Members", change: "+25%" },
];

const MEMBERS = [
  { name: "Maya Iqbal", productivity: "94%", total: "118:24:10" },
  { name: "Daniel Reyes", productivity: "89%", total: "104:45:30" },
  { name: "Sofia Novak", productivity: "83%", total: "97:12:05" },
];

/** The real card's sparkline is a hand-drawn SVG stroked in `currentColor`. */
const Sparkline = () => (
  <svg viewBox="0 0 72 46" width="100%" height="100%" className="text-green-600">
    <path
      d="M0 38 L8 33 L16 35 L24 24 L32 28 L40 15 L48 21 L56 9 L64 17 L72 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

/** Mirrors `SidebarItem`'s row: same padding, radius and active treatment. */
const NavRow = ({ Icon, label, collapsible, active }: NavItem & { active?: boolean }) => (
  <div className="mb-0.5">
    <div
      className={cn(
        "flex items-center justify-between w-full text-base px-3 text-headingTextColor dark:text-darkTextPrimary rounded-lg py-2",
        active &&
          "bg-[#ffffff] outline outline-borderColor dark:outline-darkBorder dark:bg-darkPrimaryBg",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={32} />
        <span>{label}</span>
      </div>
      {collapsible && <Plus size={18} />}
    </div>
  </div>
);

export default function OnboardingBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Oversized by 24px on every side AND padded back by the same amount.
          The bleed is what keeps the blur's soft edge off-screen (otherwise it
          draws a pale halo around the border); the matching padding is what
          keeps the content itself at its true position — without it the whole
          dashboard sat 24px left and up, clipping the sidebar so "MAIN MENU"
          read as "AIN MENU". The band is filled with the page's own ground so
          the bleed is invisible. */}
      <div className="absolute -inset-6 bg-bgSecondary p-6 blur-[6px] dark:bg-darkSecondaryBg">
        {/* Pinned to a desktop width so the mock always shows the layout the
            product is recognised by, and so the `2xl:` steps the real shell
            uses resolve the same way. */}
        <div className="flex h-full w-full min-w-[1600px] bg-bgSecondary dark:bg-darkSecondaryBg">
          {/* ── sidebar: transparent, only the logo block is a card ─────── */}
          <div className="flex h-screen w-[260px] shrink-0 flex-col py-5">
            <div className="mx-4 flex flex-row items-center justify-between rounded-2xl border border-borderColor bg-bgPrimary px-3 py-2.5 dark:border-darkBorder/70 dark:bg-darkPrimaryBg">
              <Image
                src={logoWithText}
                alt=""
                width={120}
                height={60}
                className="hidden dark:block"
              />
              <Image
                src={logoForDark}
                alt=""
                width={120}
                height={60}
                className="dark:hidden"
              />
              <span className="rounded-lg p-2 text-subTextColor dark:text-darkTextPrimary">
                <CollapsedIcon size={22} />
              </span>
            </div>

            <div className="mt-6 mb-3 px-4">
              <h2 className="mb-3 text-xs uppercase text-subTextColor dark:text-darkTextSecondary">
                Main menu
              </h2>
              {MAIN_NAV.map((item, index) => (
                <NavRow key={item.label} {...item} active={index === 0} />
              ))}
            </div>

            <div className="mx-4 border-t border-borderColor pt-3 dark:border-darkBorder">
              <h2 className="mb-2 text-xs uppercase text-subTextColor dark:text-darkTextSecondary">
                Others
              </h2>
              {OTHER_NAV.map((item) => (
                <NavRow key={item.label} {...item} />
              ))}
            </div>
          </div>

          {/* ── main panel: a bordered, rounded card inset from the edges ── */}
          <div className="my-3 mr-3 min-h-[100vh] w-full min-w-0 rounded-[8px] border border-borderColor bg-bgPrimary dark:border-darkBorder dark:bg-darkPrimaryBg">
            {/* header */}
            <div className="flex items-center justify-between rounded-t-lg border-b border-borderColor px-5 py-3.5 2xl:py-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
              <span className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-borderColor px-4 text-[14px] font-medium text-headingTextColor dark:border-input dark:text-darkTextPrimary">
                <CirclePlay className="size-5.5 text-primary" />
                00:00:00
              </span>

              <div className="flex items-center gap-4">
                <span className="flex h-10 w-56 items-center gap-2 rounded-lg border border-borderColor px-3 text-sm text-subTextColor dark:border-darkBorder">
                  <Search className="size-4" />
                  Search…
                </span>
                <span className="flex size-9 items-center justify-center rounded-lg border border-primary/50">
                  <Sun className="size-4 text-primary" />
                </span>
                <span className="border-x-2 border-borderColor px-3 dark:border-darkBorder">
                  <Bell className="size-5 text-subTextColor" />
                </span>
                <span className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-primary/50 px-4 text-[14px] font-medium text-primary">
                  <Download className="size-4" />
                  Download App
                </span>
                <span className="flex items-center gap-2 rounded-lg border border-borderColor px-3 py-1.5 dark:border-darkBorder">
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    MN
                  </span>
                  <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Md Naim Uddin
                  </span>
                </span>
              </div>
            </div>

            {/* trial strip — full-bleed inside the panel, as BillingGate renders it */}
            <div className="w-full border-b border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-500/30 dark:bg-blue-500/15">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-blue-800 dark:text-blue-200">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-medium">Free trial — 14 days left</span>
                <span className="text-blue-700/80 dark:text-blue-200/80">
                  Ends Sep 25, 2026
                </span>
                <span className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                  Choose a plan
                </span>
              </div>
            </div>

            <div className="w-full p-5">
              {/* sample-data banner */}
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 2xl:px-5 2xl:py-4 dark:border-primary/30 dark:bg-primary/15">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-headingTextColor sm:text-lg dark:text-darkTextPrimary">
                    You are viewing sample data
                  </p>
                  <p className="mt-0.5 text-sm text-subTextColor dark:text-darkTextSecondary">
                    The dashboard is filled with demo projects, members, tasks,
                    and activity so you can see how it works.
                    <br />
                    Start tracking time to see your real data.
                  </p>
                </div>
                <span className="inline-flex h-10 shrink-0 items-center gap-2 self-center rounded-lg border border-borderColor/70 bg-bgPrimary px-4 text-[14px] text-headingTextColor dark:border-darkBorder/40 dark:bg-darkTertiaryBg dark:text-darkTextPrimary">
                  <X className="h-3.5 w-3.5" />
                  Don&apos;t show
                </span>
              </div>

              {/* heading row */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">
                    Dashboard
                  </p>
                  <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                    Fri, Sep 11, 2026
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-borderColor p-1 dark:border-darkBorder">
                  {["Daily", "Weekly", "Monthly"].map((label, index) => (
                    <span
                      key={label}
                      className={cn(
                        "rounded-md px-4 py-1.5 text-sm",
                        index === 0
                          ? "bg-bgSecondary font-medium text-headingTextColor dark:bg-darkTertiaryBg dark:text-darkTextPrimary"
                          : "text-subTextColor dark:text-darkTextSecondary",
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* stat cards — two-part card, exactly as @topCart builds it */}
              <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {STATS.map(({ Icon, value, label, change }) => (
                  <div
                    key={label}
                    className="relative h-34 w-full rounded-2xl shadow-sm 2xl:h-40"
                  >
                    <div className="flex items-center justify-between rounded-t-2xl border-x-1 border-t-1 border-borderColor/70 bg-bgPrimary px-3 py-[1.4rem] 2xl:px-4 2xl:py-[1.8rem] dark:border-darkBorder/40 dark:bg-darkPrimaryBg">
                      <div className="flex items-center gap-2 2xl:gap-3">
                        <div>
                          <Icon size={36} />
                        </div>
                        <div>
                          <h2 className="text-xl font-medium text-headingTextColor 2xl:text-2xl dark:text-darkTextPrimary">
                            {value}
                          </h2>
                          <h3 className="text-sm uppercase text-subTextColor 2xl:text-[15px] dark:text-darkTextSecondary">
                            {label}
                          </h3>
                        </div>
                      </div>
                      <div className="h-9 w-[55px] 2xl:h-12 2xl:w-22">
                        <Sparkline />
                      </div>
                    </div>

                    <div className="absolute right-0 bottom-0 left-0 flex items-center gap-2 rounded-b-2xl bg-bgSecondary px-3 py-2.5 2xl:px-4 2xl:py-3 dark:bg-darkTertiaryBg">
                      <div className="w-5">
                        <TrendingUp size={20} className="text-[#12cd69]" />
                      </div>
                      <p className="font-medium text-[#12cd69]">{change}</p>
                      <p className="text-muted-foreground dark:text-darkTextSecondary">
                        Yesterday
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* members + insights */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-borderColor bg-bgPrimary p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium uppercase text-headingTextColor dark:text-darkTextPrimary">
                      Core work members
                    </span>
                    <span className="inline-flex h-10 items-center rounded-lg border border-borderColor px-4 text-sm text-subTextColor dark:border-darkBorder">
                      Top Activity
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg bg-bgSecondary px-4 py-3 text-sm text-subTextColor dark:bg-darkTertiaryBg dark:text-darkTextSecondary">
                    <span>Name</span>
                    <span>Productivity</span>
                    <span>Total Work</span>
                  </div>

                  {MEMBERS.map((member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between border-b border-borderColor py-4 last:border-0 dark:border-darkBorder"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {member.name.charAt(0)}
                        </span>
                        <span className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {member.name}
                        </span>
                      </span>
                      <span className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {member.productivity}
                      </span>
                      <span className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {member.total}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-borderColor bg-bgPrimary p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium uppercase text-headingTextColor dark:text-darkTextPrimary">
                      Insights
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-lg border border-borderColor dark:border-darkBorder">
                        <MoreVertical className="size-4 text-subTextColor" />
                      </span>
                      <span className="inline-flex h-10 items-center rounded-[8px] bg-[linear-gradient(180deg,#427fe3,#3360c8)] px-4 text-[14px] font-medium text-white">
                        View Insights
                      </span>
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-headingTextColor dark:text-darkTextPrimary">
                        Work time classification
                      </p>
                      <p className="mt-4 text-4xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        58%
                      </p>
                      <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        Productive
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-headingTextColor dark:text-darkTextPrimary">
                        Overall activity
                      </p>
                      <div className="mt-2 flex justify-center">
                        {/* three arcs, so it still reads as a donut once blurred */}
                        <svg viewBox="0 0 42 42" className="size-32 -rotate-90">
                          <circle
                            cx="21"
                            cy="21"
                            r="15.9"
                            fill="none"
                            strokeWidth="6"
                            className="stroke-slate-200 dark:stroke-slate-700"
                          />
                          <circle
                            cx="21"
                            cy="21"
                            r="15.9"
                            fill="none"
                            strokeWidth="6"
                            strokeDasharray="42 58"
                            className="stroke-sky-500"
                          />
                          <circle
                            cx="21"
                            cy="21"
                            r="15.9"
                            fill="none"
                            strokeWidth="6"
                            strokeDasharray="18 82"
                            strokeDashoffset="-42"
                            className="stroke-amber-400"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <span className="w-[30%] bg-sky-500" />
                    <span className="w-[45%] bg-slate-300 dark:bg-slate-600" />
                    <span className="w-[25%] bg-amber-400" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-subTextColor dark:text-darkTextSecondary">
                    {["1%", "25%", "50%", "75%", "100%"].map((tick) => (
                      <span key={tick}>{tick}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
