export const dynamic = "force-dynamic";

import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
import BillingGate from "@/components/Billing/BillingGate";
import { getTodayWorkTime } from "@/actions/dashboard/action";
import { cookies } from "next/headers";
import SocketProvider from "@/socket/SocketProvider";
import OnboardingGate from "@/components/Onboarding/OnboardingGate";
import { getDecodedUser } from "@/utils/decodedLogInUser";
// import TrackerChatBot from "@/components/Chats/TrackerChatBot";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const result = await getTodayWorkTime();
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
          <OnboardingGate role={currentUser?.role}></OnboardingGate>
          <div className="p-3 lg:p-5 w-full dark:bg-darkPrimaryBg lg:rounded-b-[12px]">
            {children}
          </div>
        </div>

        {/* <TrackerChatBot></TrackerChatBot> */}

      </div>
    </SocketProvider>
  );
}
