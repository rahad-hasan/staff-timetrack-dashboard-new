"use client";

import { KeyboardEvent, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// SPEC-ADAPTED: the spec assumes a pre-existing S3 upload widget. This
// codebase has no such helper today, so we let users paste attachment URLs
// (backend already accepts URL strings only and enforces the allowed prefix).

interface AttachmentUrlInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const isValidUrl = (raw: string) => {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const AttachmentUrlInput = ({
  value,
  onChange,
  max = 10,
  disabled,
  className,
}: AttachmentUrlInputProps) => {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setError("Enter a valid http(s) URL");
      return;
    }
    if (value.includes(trimmed)) {
      setError("This attachment is already added");
      return;
    }
    if (value.length >= max) {
      setError(`You can add up to ${max} attachments`);
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
    setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Paste an attachment URL"
          value={draft}
          disabled={disabled || value.length >= max}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
        />
        <Button
          type="button"
          variant="outline2"
          onClick={handleAdd}
          disabled={disabled || value.length >= max || !draft.trim()}
        >
          <Paperclip className="size-4" />
          Add
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
          {value.length}/{max} attachments
        </p>
      )}

      {value.length > 0 ? (
        <ul className="space-y-1">
          {value.map((url) => (
            <li
              key={url}
              className="flex items-center justify-between gap-2 rounded-md border border-borderColor px-2.5 py-1.5 text-xs dark:border-darkBorder dark:bg-darkPrimaryBg"
            >
              <span className="truncate text-headingTextColor dark:text-darkTextPrimary">
                {url}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(url)}
                aria-label="Remove attachment"
                className="text-subTextColor hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default AttachmentUrlInput;
