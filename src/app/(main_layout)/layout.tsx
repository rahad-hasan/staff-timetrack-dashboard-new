export const dynamic = "force-dynamic";

import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
import BillingGate from "@/components/Billing/BillingGate";
import { getTodayWorkTime } from "@/actions/dashboard/action";
import { getBillingStatus } from "@/actions/billing/action";
import { hasRole, MANAGEMENT_ROLES } from "@/lib/roles";
import { getOnboardingStatus } from "@/actions/onboarding/action";
import { getCompanyInfo } from "@/actions/settings/action";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prefetchDNS } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import SocketProvider from "@/socket/SocketProvider";
import OnboardingGate from "@/components/Onboarding/OnboardingGate";
import SessionSync from "@/components/Common/SessionSync";
import { ViewerTimeZoneProvider } from "@/components/Common/ViewerTimeZone";
import { TUTORIAL_VIDEO_ORIGIN } from "@/lib/onboarding/tutorialVideos";
import { getSessionUser, getViewerTimeZone } from "@/lib/server/session";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LiveChat from "@/components/LiveChat/LiveChat";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Resolve the tutorial CDN's DNS while the dashboard HTML is still being
   * parsed. The Quick Setup guide can only ask for a clip once
   * `/user/onboarding-status` has resolved and the gate has rendered, by which
   * point a hint issued from the client would be racing the request it is
   * meant to be ahead of. A DNS answer, unlike a TCP socket, is cached long
   * enough to still be there when the user opens the guide — and it costs one
   * UDP round trip for users who never do.
   */
  prefetchDNS(TUTORIAL_VIDEO_ORIGIN);

  // Independent reads, all started together — none may add a serial round
  // trip to a render of the shell. This layout re-renders on every hard
  // load, router.refresh(), revalidating action and live refresh (not on
  // client navigation between its pages), and every read is live.
  const currentUserRead = getDecodedUser();
  // The billing gate's first paint. Only the roles /packages/billing/status
  // answers are asked (everyone else would get a 403), chained on the session
  // read so it still runs alongside the rest of the shell. The stamp is taken
  // BEFORE the read: the gate never adopts a snapshot older than one it holds.
  // Optional by design — on any failure the gate falls back to its own fetch.
  const billingRead = currentUserRead
    .then(async (user) => {
      if (!hasRole(MANAGEMENT_ROLES, user?.role)) return null;
      const fetchedAt = Date.now();
      const res = await getBillingStatus();
      return res?.success && res.data ? { status: res.data, fetchedAt } : null;
    })
    .catch((error) => {
      unstable_rethrow(error);
      return null;
    });
  const [
    workTime,
    company,
    onboarding,
    sessionUser,
    currentUser,
    billing,
    viewerZone,
  ] = await Promise.all([
    getTodayWorkTime(),
    // Cosmetic: the Quick Setup workspace row reads correctly without a name,
    // so a failure here must never take the whole dashboard layout down.
    // `unstable_rethrow` keeps Next's own control-flow signals — baseApi's
    // session-expired redirect above all — propagating.
    getCompanyInfo().catch((error) => {
      unstable_rethrow(error);
      return null;
    }),
    // Seeds the onboarding store, so the gate no longer re-asks through a
    // server action on every load. When the sample-data gate asks for it in
    // the same render (on /dashboard), the identical GET is shared.
    getOnboardingStatus(),
    // The live identity for SessionSync (React-cached: one call per render).
    getSessionUser(),
    // Role is read here rather than letting the gates pull it from
    // logInUserStore: that store is localStorage-backed and empty on a fresh
    // browser, and role decides which onboarding steps and checklist tasks
    // exist and whether billing status may be read at all.
    currentUserRead,
    billingRead,
    // The zone every server-rendered client component formats dates in
    // (see ViewerTimeZone.tsx). Built on the same cached session read: no
    // request of its own.
    getViewerTimeZone(),
  ]);

  // The socket reconnects when the session changes. It is told so by a digest
  // of the session cookie, never the cookie itself: that value is the API
  // credential, and a prop of a client component is readable by every script
  // on the page (see SocketProvider).
  const token = (await cookies()).get("accessToken")?.value;
  const socketSession = token
    ? createHash("sha256").update(token).digest("hex").slice(0, 16)
    : undefined;

  return (
    // Outermost, so every client component below (billing banners, the
    // tables of each page) formats dates in the zone this render used.
    <ViewerTimeZoneProvider zone={viewerZone}>
      <SocketProvider session={socketSession}>
        {/* Keeps the client's cached identity (role, name, time zone) in step
            with the live session. Renders nothing. */}
        <SessionSync
          user={
            sessionUser
              ? {
                  id: sessionUser.id,
                  name: sessionUser.name,
                  email: sessionUser.email,
                  role: sessionUser.role,
                  time_zone: sessionUser.time_zone,
                  company_id: sessionUser.company_id,
                }
              : null
          }
        />
        <div
          className={` w-full flex bg-bgSecondary dark:bg-darkSecondaryBg`}
        >
          <div className="hidden lg:block">
            <SideBar></SideBar>
          </div>
          {/* min-w-0: a flex item defaults to min-width:auto, so wide content
              (e.g. a nowrap table) would stretch this panel past the viewport and
              scroll the whole page instead of scrolling inside its own container. */}
          <div className=" bg-bgPrimary w-full min-w-0 lg:border border-borderColor dark:bg-darkPrimaryBg dark:border-darkBorder lg:rounded-[8px] lg:my-3 lg:mr-3 min-h-[100vh] lg:min-h-auto">
            {/* The work time paints from this render, then keeps itself
                current; `renderedAt` tells it when a fresher value arrives. */}
            <Header
              workTime={workTime?.data?.duration}
              renderedAt={Date.now()}
            ></Header>
            {/* Billing state machine surfaces: trial/payment banners + blocked
                takeovers + the globally-triggerable Add-seats dialog. */}
            <BillingGate
              role={currentUser?.role}
              initialStatus={billing?.status ?? null}
              statusFetchedAt={billing?.fetchedAt}
            ></BillingGate>
            {/* Welcome modal, guided tour and getting-started checklist. Same
                precedent as BillingGate: one mount for the whole dashboard. */}
            <OnboardingGate
              role={currentUser?.role}
              workspaceName={company?.data?.name}
              initialStatus={
                onboarding?.success && onboarding.data ? onboarding.data : null
              }
            ></OnboardingGate>
            <div className="p-3 lg:p-5 w-full dark:bg-darkPrimaryBg lg:rounded-b-[12px]">
              {children}
            </div>
          </div>

          {/* Crisp live chat: the bottom-right launcher, bound to the signed-in
              user so a shared browser never shows one person's conversation
              to the next. */}
          <LiveChat
            user={
              currentUser
                ? {
                    id: currentUser.id,
                    email: currentUser.email,
                    role: currentUser.role,
                  }
                : null
            }
            companyName={company?.data?.name}
          />
        </div>
      </SocketProvider>
    </ViewerTimeZoneProvider>
  );
}
