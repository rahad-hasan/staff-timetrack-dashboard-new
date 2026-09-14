"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The product FAQ under the pricing grid.
 *
 * POLICY — every sentence below was checked against this repo (and the API in
 * `../backend`) before it was written, and nothing is here on the strength of
 * "that sounds like something we'd do". No compliance badge, no uptime figure,
 * no integration or provider that is not in `Integrations/registry.ts`, no
 * trial length, no percentage. Where the truth was narrower than the marketing
 * sentence, the narrower sentence won — see "there is no direct connection to
 * an outside payroll provider" and the deliberately hedged real-time answer.
 *
 * The reason is not pedantry: a reader treats an answer here as a promise and
 * makes a purchase decision on it, so a merely plausible answer is a defect.
 * The previous billing FAQ had three flatly wrong answers for exactly this
 * reason. If any of these behaviours change, re-verify the sentence in the same
 * commit or delete it — a missing answer costs far less than a wrong one.
 *
 * Nothing here is derived from the plan catalog or the subscription, so the
 * block renders identically on every plan, cycle and status.
 */

interface FaqEntry {
  question: string;
  answer: ReactNode;
}

/** Inline emphasis inside an answer — the same weight the question uses. */
const Term = ({ children }: { children: ReactNode }) => (
  <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
    {children}
  </span>
);

/**
 * An in-app destination. Only routes confirmed to exist under `src/app` —
 * `/support` on its own is NOT a page, the ticket list is `/support/tickets`.
 *
 * Underlined AT REST, not only on hover. `--primary` (#0788f3, the same hue in
 * both themes) against this answer's body colour is 2.11:1 in light and 1.92:1
 * in dark — below the 3:1 WCAG 1.4.1 requires when colour is the only thing
 * telling a link apart from the sentence around it. So the rule is the
 * affordance and hover only thickens it, which costs no reflow: decoration
 * thickness is not part of the text's box.
 */
const Go = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link
    href={href}
    className="text-primary font-medium underline decoration-1 underline-offset-4 hover:decoration-2"
  >
    {children}
  </Link>
);

/* Module scope: fixed copy with nothing to derive per render. */
const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What is Staff Time Tracker and how does it work?",
    answer: (
      <>
        <p>
          Your team installs the desktop tracker and works as normal. It records
          time against the projects and tasks they are assigned, together with
          keyboard and mouse activity, the apps and websites used, and periodic
          screenshots.
        </p>
        <p>
          Everything it captures flows into this workspace, where the dashboard,
          timesheets, attendance and reports are built from it. The web app
          captures nothing by itself — no screenshots, no apps, no activity.
          Time can still be entered by hand here: a manual entry goes to{" "}
          <Go href="/timesheets/manual-requests">Manual Requests</Go> and counts
          once it is approved. <Go href="/download">Get the desktop app</Go>.
        </p>
      </>
    ),
  },
  {
    question: "Is employee data secure on Staff Time Tracker?",
    answer: (
      <>
        <p>
          Every record — members, projects, time, screenshots — belongs to your
          workspace and is read only within it, and what any one person can see
          is decided by their role. Passwords are stored hashed, and screenshots
          and uploaded files are served through links that expire rather than
          from public URLs.
        </p>
        <p>
          Card details are typed into Stripe&apos;s own fields and are{" "}
          <Term>never stored here</Term> — we only ever see the brand, the last
          four digits and the expiry. You also control the capture itself: URL
          tracking, and whether members may delete their own screenshots, are
          switches <Term>only an admin</Term> can change, under{" "}
          <Go href="/settings">Settings</Go> → Configuration. App and website
          capture can be turned off for one member at a time.
        </p>
      </>
    ),
  },
  {
    question: "Who can use Staff Time Tracker?",
    answer: (
      <>
        <p>
          Anyone you add to the workspace, under one of five roles:{" "}
          <Term>Admin</Term>, <Term>Manager</Term>, <Term>HR</Term>,{" "}
          <Term>Project Manager</Term> and <Term>Employee</Term>. Employees get
          a focused view — their own timesheets, activity, projects and
          attendance — while admins, managers and HR also get the team-wide
          screens.
        </p>
        <p>
          A few areas are narrower still: payroll is admin and HR only, and
          changing the plan or the card is admin only. People are added directly
          from <Go href="/members">Members</Go>, with their role set at that
          point and changeable later.
        </p>
      </>
    ),
  },
  {
    question: "Can Staff Time Tracker integrate with payroll systems?",
    answer: (
      <>
        <p>
          There is no direct connection to an outside payroll provider. Payroll
          is built in instead: a run for a given month is generated from tracked
          hours and each person&apos;s payroll profile — hourly or fixed
          monthly, with overtime, leave, holidays and manual adjustments — and
          you review and approve it before anything is final.
        </p>
        <p>
          Any run can be exported as a <Term>CSV</Term> to hand to whatever
          system actually pays people, and members download their own payslips
          as PDFs. It lives under <Go href="/payroll">Payroll</Go>.
        </p>
      </>
    ),
  },
  {
    question: "Can Staff Time Tracker track remote and hybrid teams?",
    answer: (
      <>
        <p>
          Yes — the tracker runs on each person&apos;s own computer, so where
          they work makes no difference. Every member has their own time zone,
          and timesheets can be read in a time zone you pick rather than only
          one.
        </p>
        <p>
          Shifts are set up as schedules with their own start, end, break and
          grace allowances and assigned per member, and{" "}
          <Go href="/report/attendance">attendance</Go>, leave and public
          holidays are all recorded against them.
        </p>
      </>
    ),
  },
  {
    question: "Is Staff Time Tracker easy to set up?",
    answer: (
      <>
        <p>
          Setting the workspace up happens in the browser: create the
          organisation, choose a plan, then work through the getting-started
          checklist — add a client, create a project, add your team. It is not
          only on the <Go href="/dashboard">dashboard</Go>: it follows you onto
          every screen in the workspace. Most steps come with a short
          walkthrough video, and a guided tour covers the rest of the screens.
        </p>
        <p>
          The one thing that happens outside the browser is installing the{" "}
          <Go href="/download">desktop tracker</Go> on each person&apos;s
          computer. Until that is running and signed in, tracked time stays at
          zero.
        </p>
      </>
    ),
  },
  {
    question: "Does Staff Time Tracker provide real-time reporting?",
    answer: (
      <>
        <p>
          In part, and it is worth being exact. Notifications are pushed to you
          live over an open connection, and the{" "}
          <Go href="/insights/suspensions">Suspicious Activity</Go> view keeps
          refreshing itself on its own while a tracking suspension is still
          running.
        </p>
        <p>
          The dashboard, timesheets, attendance and activity screens are not
          streamed: they show everything the trackers have uploaded so far and
          update when you open them or change the date. So you can follow today
          as it happens — by reloading, not by watching a live feed.
        </p>
      </>
    ),
  },
  {
    question: "Does Staff Time Tracker offer analytics insights?",
    answer: (
      <>
        <p>
          Yes. The dashboard summarises the day, week or month and splits
          tracked time into <Term>productive</Term>, <Term>active</Term> and{" "}
          <Term>idle</Term>.{" "}
          <Go href="/insights/performance">Insights → Performance</Go> charts{" "}
          <Term>one member at a time</Term> across a month — worked time against
          activity, attendance exceptions, top tasks by hours, a calendar
          heatmap.
        </p>
        <p>
          Suspicious Activity scores tracking anomalies by severity, and app and
          website usage are listed on their own under Activity.
        </p>
      </>
    ),
  },
];

/**
 * One question.
 *
 * A component per entry rather than one shared open-index: `useId` is a hook,
 * so each item has to own its render in order to own its button/panel id pair,
 * and independent `useState` means opening a second answer does not close the
 * one someone is halfway through reading.
 *
 * The disclosure is hand-rolled the same way `PlanComparisonTable`'s is — the
 * repo carries no accordion primitive, and `aria-expanded`/`aria-controls` over
 * the `hidden` attribute is the whole contract. The panel is hidden rather than
 * unmounted so `aria-controls` always resolves to a real element.
 */
function FaqItem({ entry, order }: { entry: FaqEntry; order: number }) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const panelId = useId();

  return (
    <div
      /* See the layout note below: this is a flex item of the SECTION's
         container on phones and of its own column from md up, so `order`
         is what restores 1-8 reading order in the single-column case. */
      style={{ order }}
      className={cn(
        "overflow-hidden rounded-lg px-5 py-4 transition-colors",
        // The design's pale grey bar, but the fill alone cannot carry it: on
        // this panel's white (`PlanPricingSection`, `bg-white
        // dark:bg-darkPrimaryBg`) `bgSecondary` is 1.07:1, and `darkTertiaryBg`
        // on `darkPrimaryBg` only 1.16:1. So the house hairline draws the edge
        // and the fill stays pale — a darker fill would read as a filled card,
        // which is a different component in this page's vocabulary.
        "border border-borderColor bg-bgSecondary",
        "dark:border-darkBorder dark:bg-darkTertiaryBg",
        // Hover is the only other affordance a collapsed bar gets, so it has to
        // LIFT in both themes. `darkSecondaryBg` (#00172f) is darker than the
        // resting `darkTertiaryBg` (#102041) — it used to sink the bar into the
        // page instead. `darkTertiaryBg` is itself the dark half of the repo's
        // hover step (`hover:bg-bgSecondary dark:hover:bg-darkTertiaryBg` —
        // `SegmentedPills`, `QuickSetupDialog`), so a surface resting there
        // lifts with the next token up: a wash of the border colour, the same
        // `/40` on both sides and the same pairing `RichTextEditor` uses.
        "hover:bg-borderColor/40 dark:hover:bg-darkBorder/40",
      )}
    >
      {/* h4 under the section's h3, which sits under the page's "Plans &
          pricing" h2 — the question is a heading, so a screen reader can walk
          the FAQ by heading instead of tabbing through every trigger. */}
      <h4>
        <button
          id={triggerId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((previous) => !previous)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 text-left",
            "focus-visible:ring-primary rounded-sm focus-visible:ring-2 focus-visible:outline-none",
          )}
        >
          <span className="flex-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            {entry.question}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-subTextColor transition-transform dark:text-darkTextSecondary",
              // Rotation only, per the design: the open state is already carried
              // by the panel and by `aria-expanded`, and recolouring the chevron
              // to `--primary` made it read as an interactive accent of its own.
              open && "rotate-180",
            )}
          />
        </button>
      </h4>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!open}
        className="mt-3 space-y-2 text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary"
      >
        {entry.answer}
      </div>
    </div>
  );
}

/**
 * LAYOUT — two independent columns, not a two-column grid.
 *
 * A `grid-cols-2` puts both cells of a row in the same row track, so the
 * moment one answer opens its collapsed neighbour's track grows with it and
 * leaves a block of dead space beside the open answer. Two separate flex
 * columns have no shared rows at all: an open answer pushes down only the
 * questions underneath it, which is what the design's staggered bars imply.
 *
 * The cost is DOM order — the odd questions live in one wrapper and the even
 * ones in the other, which on a phone (one column) would read 1,3,5,7,2,4,6,8.
 * So each wrapper is `display: contents` below md: the eight items become flex
 * items of the section container directly and their `order` (1-8) restores the
 * intended sequence. From md up the wrappers are real flex columns, where the
 * same ascending `order` values are a no-op. One list, one id pair per item,
 * no duplicated markup for the two breakpoints.
 */
export default function FaqSection({ className }: { className?: string }) {
  const headingId = useId();

  const columns = [
    FAQ_ENTRIES.filter((_, index) => index % 2 === 0),
    FAQ_ENTRIES.filter((_, index) => index % 2 === 1),
  ];

  return (
    <section className={className} aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-center text-2xl font-bold text-headingTextColor sm:text-[28px] dark:text-darkTextPrimary"
      >
        Got Questions? We&apos;ve Got Answers
      </h3>
      {/* Width-constrained so it wraps rather than running the full page. */}
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary">
        Everything you need to know about Staff Time Tracker — from setup to
        team management.
      </p>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {columns.map((entries, columnIndex) => (
          <div
            key={columnIndex}
            className="contents md:flex md:min-w-0 md:flex-1 md:flex-col md:gap-4"
          >
            {entries.map((entry) => (
              <FaqItem
                key={entry.question}
                entry={entry}
                order={FAQ_ENTRIES.indexOf(entry) + 1}
              />
            ))}
          </div>
        ))}
      </div>

      {/* NOT in the supplied design — our addition. An FAQ's job is to answer
          the common questions, and the reader whose question is not one of the
          eight is exactly the one about to leave; `/support/tickets` is the
          route that reaches a human. Kept deliberately, so it is not a drift to
          be "corrected" back out on the next pass at the design. */}
      <p className="mt-8 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
        Still not sure?{" "}
        <Go href="/support/tickets">Open a support ticket</Go> and we&apos;ll
        look at your workspace with you.
      </p>
    </section>
  );
}
