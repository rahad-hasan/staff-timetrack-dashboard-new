"use client";

import { useEffect, useState } from "react";
import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  attachmentDisplayName,
  attachmentOpenHref,
  isImageAttachment,
} from "@/lib/supportAttachments";

interface AttachmentListProps {
  urls: string[];
  className?: string;
}

const AttachmentList = ({ urls, className }: AttachmentListProps) => {
  if (!urls?.length) return null;

  return (
    <div className={cn("mt-2 flex flex-wrap gap-2", className)}>
      {urls.map((value, index) => (
        <AttachmentTile key={`${index}-${value}`} value={value} />
      ))}
    </div>
  );
};

/**
 * `value` is whatever the API sent: a signed bucket URL (expires after a few
 * minutes) or a legacy external URL. Clicks go through the open route, which
 * mints a fresh signed URL, so a link still works an hour later. Thumbnails
 * use the embedded URL first and fall back to the open route once it expires.
 */
const AttachmentTile = ({ value }: { value: string }) => {
  const name = attachmentDisplayName(value);
  const href = attachmentOpenHref(value);
  const isImage = isImageAttachment(value);
  const [src, setSrc] = useState(value);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setSrc(value);
    setBroken(false);
  }, [value]);

  if (isImage && !broken) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block h-20 w-20 overflow-hidden rounded-md border border-borderColor bg-bgSecondary/40 dark:border-darkBorder dark:bg-darkPrimaryBg"
        title={name}
      >
        {/* Signed bucket URLs are unique per response; next/image cannot cache or optimise them. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => {
            if (href !== value && src !== href) {
              setSrc(href);
              return;
            }
            setBroken(true);
          }}
        />
        <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
          <ImageIcon className="mr-1 inline size-3" />
          {name}
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-[240px] items-center gap-2 rounded-md border border-borderColor bg-white px-2.5 py-1.5 text-xs text-headingTextColor hover:border-primary/40 hover:text-primary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
      title={name}
    >
      {isImage ? (
        <ImageIcon className="size-3.5 shrink-0" />
      ) : (
        <FileText className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{name}</span>
    </a>
  );
};

export default AttachmentList;
