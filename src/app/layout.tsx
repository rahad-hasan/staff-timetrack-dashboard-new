import type { Metadata } from "next";
// Imported before next/font/local, whose generated CSS takes that import's place, so the latin
// faces come last as in Google's CSS: where subsets overlap, the face declared last is tried first.
import "./fonts/roboto/roboto.css";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/Theme/theme-provider";
import { SidebarRouteSync } from "@/utils/SidebarRouteSync";
import SetGlobalColor from "@/components/Common/SetGlobalColor";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

// const inter = Inter({
//     subsets: ['latin'],
//     weight: ['300', '400', '500', '600', '700', '800', '900'],
//     variable: '--font-inter',
//     display: 'swap'
// });

// Roboto, vendored in fonts/roboto (OFL 1.1) so builds never download it from Google Fonts.
// This call is the latin subset, the one file preloaded, with a face per weight the Google call
// asked for (one variable file; no 600 face, so font-semibold still renders at 700). roboto.css
// declares the other subsets, which need their own unicode-ranges (next/font/local gives all of a
// call's faces one), and the "Roboto Fallback" face with next/font/google's metrics; supportToast's
// font stack names both families. The stack ends in the generic sans-serif: that face is local
// Arial, so without it a glyph Roboto lacks fell back to the browser's default serif wherever Arial
// is not installed. `next dev --turbopack` ignores `declarations` and calls the family "roboto",
// which CSS matches case-insensitively.
const roboto = localFont({
  src: [
    { path: "./fonts/roboto/roboto-latin.woff2", weight: "300" },
    { path: "./fonts/roboto/roboto-latin.woff2", weight: "400" },
    { path: "./fonts/roboto/roboto-latin.woff2", weight: "500" },
    { path: "./fonts/roboto/roboto-latin.woff2", weight: "700" },
    { path: "./fonts/roboto/roboto-latin.woff2", weight: "800" },
    { path: "./fonts/roboto/roboto-latin.woff2", weight: "900" },
  ],
  declarations: [
    { prop: "font-family", value: "Roboto" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
  adjustFontFallback: false,
  fallback: ["Roboto Fallback", "sans-serif"],
  variable: "--font-roboto",
  display: "swap",
});

// const nunito = Nunito({
//     subsets: ['latin'],
//     weight: ['300', '400', '500', '700', '800', '900'],
//     variable: '--font-nunito',
//     display: 'swap'
// });

export const metadata: Metadata = {
  title: "Staff Time Tracker Dashboard",
  description: "Staff Time Tracker Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Browser extensions (Grammarly, ColorZilla, Monica…) stamp their own
  // attributes on <body> before React hydrates. `suppressHydrationWarning`
  // tolerates that for the body's own attributes only. Never copy an
  // extension's attributes into this markup: every user would receive them.
  return (
    <html lang="en" suppressHydrationWarning className={roboto.className}>
      <body
        className={`antialiased flex bg-[#f6f7f9] dark:bg-darkSecondaryBg`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Inside ThemeProvider so the toaster follows the app theme
              instead of falling back to the OS preference. */}
          <Toaster position="top-center" />
          <SetGlobalColor />
          <SidebarRouteSync />
          {/* <ReplaceActiveNavAfterRemount /> */}
          <NextTopLoader color="#2bb0f3" height={2} showSpinner={false} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
