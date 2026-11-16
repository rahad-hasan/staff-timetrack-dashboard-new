"use client";
import { useSearchParams } from "next/navigation";
import {
  resolveScreenshotTab,
  SCREENSHOT_TABS,
  type ScreenshotTab,
} from "./screenshotTabs";

const ScreenshotsToggle = () => {
  const searchParams = useSearchParams();
  const activeTab = resolveScreenshotTab(searchParams.get("tab"));

  // Both views are drawn from data the page already holds (ScreenshotsDay),
  // so a tab is only a URL change: history.pushState updates useSearchParams
  // without asking the server for anything. router.push() re-rendered the
  // route on the server and fetched the whole day again for each switch.
  // Back and Forward step through the tabs as before.
  const setTab = (tab: ScreenshotTab) => {
    if (tab === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="flex gap-3">
      <div className="grid grid-cols-2 xl:flex mt-3 lg:mt-0 bg-bgSecondary dark:bg-darkTertiaryBg rounded-lg ">
        {SCREENSHOT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg text-center
                                    ${
                                      activeTab === tab
                                        ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                        : " text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* <Button><Plus size={20} />Add Time</Button> */}
    </div>
  );
};

export default ScreenshotsToggle;
