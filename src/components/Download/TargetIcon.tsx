import Image from "next/image";

import { cn } from "@/lib/utils";

import type { IPlatformGroup } from "./downloadTargets";

interface ITargetIconProps {
  group: IPlatformGroup;
  /** Rendered edge length in pixels. */
  size: number;
  className?: string;
}

/**
 * The platform glyph. Bundled PNGs rather than remote images: `next.config.ts`
 * allowlists seven hosts and github.com is not among them.
 */
const TargetIcon = ({ group, size, className }: ITargetIconProps) => (
  <Image
    src={group.icon}
    alt={group.alt}
    width={size}
    height={size}
    style={{ width: size, height: size }}
    className={cn("object-contain", group.iconClassName, className)}
  />
);

export default TargetIcon;
