"use client";

import { RefreshCcw } from "lucide-react";
import Image, { ImageProps } from "next/image";
import { MouseEvent, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "onError"> & {
  fallbackClassName?: string;
};

const ScreenshotImage = ({
  src,
  alt,
  className,
  fallbackClassName,
  ...rest
}: Props) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (errored) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gray-100 dark:bg-darkSecondaryBg text-subTextColor dark:text-darkTextSecondary",
          fallbackClassName,
        )}
      >
        <button
          type="button"
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            window.location.reload();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <RefreshCcw size={14} />
          Reload
        </button>
        <p className="text-[10px] opacity-70">
          Session expired — please reload
        </p>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
};

export default ScreenshotImage;
