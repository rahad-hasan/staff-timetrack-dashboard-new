export const dynamic = "force-dynamic";

import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
import { getTodayWorkTime } from "@/actions/dashboard/action";
import { cookies } from "next/headers";
import SocketProvider from "@/socket/SocketProvider";
import GoogleReconnectBanner from "@/components/Integrations/GoogleReconnectBanner";
// import TrackerChatBot from "@/components/Chats/TrackerChatBot";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const result = await getTodayWorkTime();
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  return (
    <SocketProvider token={token?.value}>
      <div
        className={` w-full flex bg-bgSecondary dark:bg-darkSecondaryBg`}
      >
        <div className="hidden lg:block">
          <SideBar></SideBar>
        </div>
        <div className=" bg-bgPrimary w-full lg:border border-borderColor dark:bg-darkPrimaryBg dark:border-darkBorder lg:rounded-[8px] lg:my-3 lg:mr-3 min-h-[100vh] lg:min-h-auto">
          <Header data={result?.data}></Header>
          <div className="p-3 lg:p-5 w-full dark:bg-darkPrimaryBg lg:rounded-b-[12px]">
            <GoogleReconnectBanner />
            {children}
          </div>
        </div>

        {/* <TrackerChatBot></TrackerChatBot> */}

      </div>
    </SocketProvider>
  );
}
