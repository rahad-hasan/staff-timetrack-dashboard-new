import type { Metadata } from "next";

import DownloadPage from "@/components/Download/DownloadPage";

export const metadata: Metadata = {
  title: "Staff Time Tracker Download",
  description:
    "Download the Staff Time Tracker desktop app for Windows, macOS (Apple Silicon and Intel) and Linux.",
};

const Download = () => {
  return <DownloadPage></DownloadPage>;
};

export default Download;
