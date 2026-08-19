"use client";

import type { StaticImageData } from "next/image";

import EntityAvatar from "@/components/Common/EntityAvatar";
import { matchByWords } from "@/utils/entityAvatar";
import { getFaviconUrl } from "@/utils/siteIcon";
import adobe_acrobat from "@/assets/apps_logo/adobe_acrobat.png";
import adobe_illustrator from "@/assets/apps_logo/adobe_illustrator.png";
import chrome_logo from "@/assets/apps_logo/chrome_logo.png";
import edge from "@/assets/apps_logo/microsoft_edge.png";
import figma_logo from "@/assets/apps_logo/figma_logo.png";
import microsoft_excel from "@/assets/apps_logo/microsoft_excel.png";
import microsoft_office_word from "@/assets/apps_logo/microsoft_office_word.png";
import microsoft_powerPoint from "@/assets/apps_logo/microsoft_powerPoint.png";
import notepad from "@/assets/apps_logo/notepad.png";
import photoshop_logo from "@/assets/apps_logo/photoshop_logo.png";
import postman_logo from "@/assets/apps_logo/postman_logo.png";
import premiere_pro_logo from "@/assets/apps_logo/premiere_pro_logo.png";
import teams_logo from "@/assets/apps_logo/teams_logo.png";
import terminal_logo from "@/assets/apps_logo/terminal_logo.png";
import time_tracker_logo from "@/assets/apps_logo/time_tracker_logo.png";
import vs_code_logo from "@/assets/apps_logo/vs_code_logo.png";
import zoom_logo from "@/assets/apps_logo/zoom_logo.png";

/** Bundled artwork wins: it is the sharpest icon we can show. */
const APP_LOGOS: Record<string, StaticImageData> = {
  chrome: chrome_logo,
  figma: figma_logo,
  photoshop: photoshop_logo,
  premiere: premiere_pro_logo,
  teams: teams_logo,
  tracker: time_tracker_logo,
  vscode: vs_code_logo,
  code: vs_code_logo,
  zoom: zoom_logo,
  word: microsoft_office_word,
  postman: postman_logo,
  terminal: terminal_logo,
  command: terminal_logo,
  powerpoint: microsoft_powerPoint,
  edge: edge,
  excel: microsoft_excel,
  notepad: notepad,
  acrobat: adobe_acrobat,
  illustrator: adobe_illustrator,
};

/**
 * Apps whose brand also lives on the web borrow their site's favicon, which
 * keeps the long tail covered without bundling an asset per product. Anything
 * missing here — "Task Manager", "Windows Explorer", in-house tools — falls
 * through to a coloured initials tile.
 */
const APP_DOMAINS: Record<string, string> = {
  firefox: "firefox.com",
  thunderbird: "thunderbird.net",
  brave: "brave.com",
  opera: "opera.com",
  vivaldi: "vivaldi.com",
  safari: "apple.com",
  slack: "slack.com",
  discord: "discord.com",
  telegram: "telegram.org",
  whatsapp: "whatsapp.com",
  signal: "signal.org",
  skype: "skype.com",
  outlook: "outlook.com",
  gmail: "google.com",
  spotify: "spotify.com",
  vlc: "videolan.com",
  obs: "obsproject.com",
  steam: "steampowered.com",
  notion: "notion.so",
  obsidian: "obsidian.md",
  github: "github.com",
  gitlab: "gitlab.com",
  docker: "docker.com",
  insomnia: "insomnia.rest",
  jira: "atlassian.com",
  confluence: "atlassian.com",
  trello: "trello.com",
  asana: "asana.com",
  linear: "linear.app",
  canva: "canva.com",
  blender: "blender.org",
  unity: "unity.com",
  audacity: "audacityteam.org",
  "sublime text": "sublimetext.com",
  "android studio": "developer.android.com",
  intellij: "jetbrains.com",
  pycharm: "jetbrains.com",
  webstorm: "jetbrains.com",
  phpstorm: "jetbrains.com",
  datagrip: "jetbrains.com",
  goland: "jetbrains.com",
  clion: "jetbrains.com",
  rider: "jetbrains.com",
  xcode: "apple.com",
  warp: "warp.dev",
  iterm: "iterm2.com",
};

const AppAvatar = ({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) => {
  const appName = name ?? "";
  const logo = matchByWords(appName, APP_LOGOS);
  const domain = logo ? null : matchByWords(appName, APP_DOMAINS);

  return (
    <EntityAvatar
      label={appName}
      src={logo ?? getFaviconUrl(domain)}
      // Bundled logos are drawn to sit on any background; borrowed favicons are
      // not, so only those get the white plate.
      surface={logo ? "bare" : "plate"}
      className={className}
    />
  );
};

export default AppAvatar;
