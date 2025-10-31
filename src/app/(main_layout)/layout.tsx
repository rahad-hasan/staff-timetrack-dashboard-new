import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={` w-full flex bg-[#f6f7f9] dark:bg-darkSecondaryBg`}
    >
      <div className="hidden md:block">
        <SideBar></SideBar>
      </div>
      <div className=" bg-white dark:bg-darkSecondaryBg w-full md:border-2 border-borderColor dark:border-darkBorder md:rounded-[12px] md:my-3 md:mr-3 min-h-[100vh] md:min-h-auto">
        <Header></Header>
        <div className="p-3 md:p-5 w-full min-h-[100vh] dark:bg-darkPrimaryBg md:rounded-b-[12px]">
          {children}
        </div>
      </div>
    </div>
  );
}
