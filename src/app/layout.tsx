import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Theme/theme-provider";
import { SidebarRouteSync } from "@/utils/SidebarRouteSync";
import SetGlobalColor from "@/components/Common/SetGlobalColor";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-inter',
    display: 'swap'
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
        <html lang="en" suppressHydrationWarning className={inter.className}>
            <body
                className={`antialiased flex bg-[#f6f7f9] dark:bg-darkSecondaryBg`}
                data-gr-ext-installed=""
                cz-shortcut-listen="true"
                monica-id="ofpnmcalabcbjgholdjcjblkibolbppb"
                monica-version="7.9.7"
                data-new-gr-c-s-check-loaded="14.1263.0"
            >
                <Toaster position="top-center"/>
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
