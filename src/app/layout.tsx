import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Theme/theme-provider";
import { SidebarRouteSync } from "@/utils/SidebarRouteSync";
import SetGlobalColor from "@/components/Common/SetGlobalColor";

const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-nunito',
    display: 'swap',
})

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
        <html lang="en" suppressHydrationWarning className={montserrat.className}>
            <body
                className={`antialiased flex bg-[#f6f7f9] dark:bg-darkSecondaryBg`}
                data-gr-ext-installed=""
                cz-shortcut-listen="true"
                monica-id="ofpnmcalabcbjgholdjcjblkibolbppb"
                monica-version="7.9.7"
                data-new-gr-c-s-check-loaded="14.1261.0"
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SetGlobalColor />
                    <SidebarRouteSync />
                    {children}
                </ThemeProvider>
            </body>
        </html >
    );
}
