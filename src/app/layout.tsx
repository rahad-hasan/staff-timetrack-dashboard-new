import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Raleway, Lato  } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Theme/theme-provider";
import { SidebarRouteSync } from "@/utils/SidebarRouteSync";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-poppins',
})
const raleway = Raleway({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-raleway',
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
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${poppins.variable} ${poppins.variable} antialiased flex bg-[#f6f7f9] dark:bg-darkSecondaryBg`}
                data-gr-ext-installed=""
                cz-shortcut-listen="true"
                monica-id="ofpnmcalabcbjgholdjcjblkibolbppb"
                monica-version="7.9.7"
                data-new-gr-c-s-check-loaded="14.1259.0"
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SidebarRouteSync />
                    {children}
                </ThemeProvider>
            </body>
        </html >
    );
}
