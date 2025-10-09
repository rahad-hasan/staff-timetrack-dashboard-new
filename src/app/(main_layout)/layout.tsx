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
      <div className="">
        <SideBar></SideBar>
      </div>
      <div className=" bg-white w-full border-2 rounded-[12px] my-3 mr-3">
        <Header></Header>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
