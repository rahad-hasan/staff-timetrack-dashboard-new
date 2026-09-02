export const dynamic = "force-dynamic";

import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
import BillingGate from "@/components/Billing/BillingGate";
import { getTodayWorkTime } from "@/actions/dashboard/action";
import { getCompanyInfo } from "@/actions/settings/action";
import { cookies } from "next/headers";
import { prefetchDNS } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import SocketProvider from "@/socket/SocketProvider";
import OnboardingGate from "@/components/Onboarding/OnboardingGate";
import { TUTORIAL_VIDEO_ORIGIN } from "@/lib/onboarding/tutorialVideos";
import { getDecodedUser } from "@/utils/decodedLogInUser";
// import TrackerChatBot from "@/components/Chats/TrackerChatBot";

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

  // Two independent reads, so they go in parallel — the workspace name must
  // not add a serial round-trip to every dashboard navigation. `getCompanyInfo`
  // is force-cached with a 60s revalidate behind the shared "company" tag, so
  // after the first request this is a cache read.
  const [result, company] = await Promise.all([
    getTodayWorkTime(),
    // Cosmetic: the Quick Setup workspace row reads correctly without a name,
    // so a failure here must never take the whole dashboard layout down.
    // `unstable_rethrow` keeps Next's own control-flow signals — baseApi's
    // session-expired redirect above all — propagating.
    getCompanyInfo().catch((error) => {
      unstable_rethrow(error);
      return null;
    }),
  ]);

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");
  // Read here rather than letting the gate pull role from logInUserStore:
  // that store is localStorage-backed and empty on a fresh browser, and role
  // decides which onboarding steps and checklist tasks exist at all.
  const currentUser = await getDecodedUser();

  return (
    <SocketProvider token={token?.value}>
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
          <Header data={result?.data}></Header>
          {/* Billing state machine surfaces: trial/payment banners + blocked
              takeovers + the globally-triggerable Add-seats dialog. */}
          <BillingGate></BillingGate>
          {/* Welcome modal, guided tour and getting-started checklist. Same
              precedent as BillingGate: one mount for the whole dashboard. */}
          <OnboardingGate
            role={currentUser?.role}
            workspaceName={company?.data?.name}
          ></OnboardingGate>
          <div className="p-3 lg:p-5 w-full dark:bg-darkPrimaryBg lg:rounded-b-[12px]">
            {children}
          </div>
        </div>

        {/* <TrackerChatBot></TrackerChatBot> */}

      </div>
    </SocketProvider>
  );
}
