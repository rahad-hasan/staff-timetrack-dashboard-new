import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={` w-full flex bg-[#f6f7f9]`}
    >
      <div className="hidden md:block">
        <SideBar></SideBar>
      </div>
      <div className=" bg-white w-full md:border-2 md:rounded-[12px] md:my-3 md:mr-3 ">
        <Header></Header>
        <div className="p-3 md:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
