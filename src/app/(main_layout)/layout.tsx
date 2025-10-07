import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import SideBar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Staff Time Tracker Dashboard",
  description: "Staff Time Tracker Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-[#f6f7f9]`}
        data-new-gr-c-s-check-loaded="14.1256.0"
        data-gr-ext-installed=""
        cz-shortcut-listen="true"
        monica-id="ofpnmcalabcbjgholdjcjblkibolbppb"
        monica-version="7.9.7"
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
      </body>
    </html >
  );
}
