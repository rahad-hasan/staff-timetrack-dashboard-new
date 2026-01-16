import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
// import TrackerChatBot from "@/components/Chats/TrackerChatBot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <div
      className={` w-full flex bg-bgSecondary dark:bg-darkSecondaryBg`}
    >
      <div className="hidden md:block">
        <SideBar></SideBar>
      </div>
      <div className=" bg-bgPrimary w-full md:border border-borderColor dark:bg-darkPrimaryBg dark:border-darkBorder md:rounded-[8px] md:my-3 md:mr-3 min-h-[100vh] md:min-h-auto">
        <Header></Header>
        <div className="p-3 md:p-5 w-full dark:bg-darkPrimaryBg md:rounded-b-[12px]">
          {children}
        </div>
      </div>

      {/* <TrackerChatBot></TrackerChatBot> */}

    </div>
  );
}
