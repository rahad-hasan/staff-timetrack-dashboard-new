import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;

const filenameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || parsed.hostname;
  } catch {
    return url;
  }
};

interface AttachmentListProps {
  urls: string[];
  className?: string;
}

const AttachmentList = ({ urls, className }: AttachmentListProps) => {
  if (!urls?.length) return null;

  return (
    <div className={cn("mt-2 flex flex-wrap gap-2", className)}>
      {urls.map((url) => {
        const isImage = IMAGE_EXTENSIONS.test(url);
        const name = filenameFromUrl(url);

        if (isImage) {
          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block h-20 w-20 overflow-hidden rounded-md border border-borderColor dark:border-darkBorder"
              title={name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
                <ImageIcon className="mr-1 inline size-3" />
                image
              </span>
            </a>
          );
        }

        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[240px] items-center gap-2 rounded-md border border-borderColor bg-white px-2.5 py-1.5 text-xs text-headingTextColor hover:border-primary/40 hover:text-primary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
            title={name}
          >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        );
      })}
    </div>
  );
};

export default AttachmentList;
