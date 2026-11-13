"use client";

import dynamic from "next/dynamic";
import SettingsPanelSkeleton from "./SettingsPanelSkeleton";

/*
 * /settings shows one tab at a time, but static imports put every tab's code —
 * the phone and time-zone pickers, the integration screens — into the page's
 * bundle whichever tab was open. Each tab is now its own chunk, fetched when
 * that tab renders (and still server-rendered, so a direct visit paints at
 * once).
 */
const loading = () => <SettingsPanelSkeleton />;

export const ProfileTab = dynamic(() => import("./Profile"), { loading });

export const SlackConnectedAppsPanel = dynamic(
  () => import("@/components/Integrations/SlackConnectedApps"),
);

export const ConfigurationTab = dynamic(() => import("./Configuration"), {
  loading,
});

export const AppIntegrationsTab = dynamic(() => import("./AppIntegrations"), {
  loading,
});

export const ChangePasswordTab = dynamic(() => import("./ChangePassword"), {
  loading,
});
