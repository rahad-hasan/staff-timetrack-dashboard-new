"use client";

import axios from "axios";
import {
  insertParsedHolidays,
  parseLeaveHolidayImport,
} from "@/actions/leaves/action";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileWarning,
  Loader2,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MandatoryLeaveImportPayload,
  MandatoryLeaveParsePayload,
  MandatoryLeaveParseResult,
} from "@/types/type";

type MandatoryLeaveImportDialogProps = {
  onOpenChange: (open: boolean) => void;
  selectedYear: string;
  onImported: () => void | Promise<void>;
};

const SUPPORTED_TEXT_EXTENSIONS = new Set(["csv", "tsv", "txt", "text", "psv"]);
const SUPPORTED_TEXT_MIME_TYPES = new Set([
  "application/csv",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
]);
const FILE_ACCEPT =
  ".csv,.tsv,.txt,.text,.psv,.pdf,text/csv,text/plain,application/pdf";

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formattedSize =
    size >= 10 || unitIndex === 0 ? Math.round(size) : Number(size.toFixed(1));
  return `${formattedSize} ${units[unitIndex]}`;
}

function getFileKind(file: File): "text" | "pdf" | null {
  const extension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();

  if (extension === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }

  if (
    SUPPORTED_TEXT_EXTENSIONS.has(extension) ||
    mimeType.startsWith("text/") ||
    SUPPORTED_TEXT_MIME_TYPES.has(mimeType)
  ) {
    return "text";
  }

  return null;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });
}

async function buildParsePayload(
  file: File,
): Promise<MandatoryLeaveParsePayload> {
  const fileKind = getFileKind(file);

  if (!fileKind) {
    throw new Error("Unsupported file type. Upload CSV, TSV, TXT, or PDF.");
  }

  if (fileKind === "pdf") {
    return {
      file_name: file.name,
      file_content: await readFileAsDataUrl(file),
      file_encoding: "base64",
    };
  }

  return {
    file_name: file.name,
    file_content: await file.text(),
    file_encoding: "text",
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : null;

    return responseMessage || error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function showErrorToast(message: string) {
  toast.error(message, {
    style: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
    },
  });
}

function previewRawValue(raw: unknown) {
  if (raw === null || raw === undefined) {
    return "-";
  }

  if (typeof raw === "string") {
    return raw;
  }

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function getParsedStatusClasses(alreadyExists: boolean) {
  return alreadyExists
    ? "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
    : "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200";
}

function getParsedStatusLabel(alreadyExists: boolean) {
  return alreadyExists ? "Already exists" : "Ready to import";
}

function normalizeParseResult(
  data: Partial<MandatoryLeaveParseResult> | null | undefined,
) {
  return {
    parsed: Array.isArray(data?.parsed) ? data.parsed : [],
    rejected: Array.isArray(data?.rejected) ? data.rejected : [],
    summary: {
      total_rows: data?.summary?.total_rows ?? 0,
      parsed_count: data?.summary?.parsed_count ?? 0,
      rejected_count: data?.summary?.rejected_count ?? 0,
      existing_count: data?.summary?.existing_count ?? 0,
    },
  } satisfies MandatoryLeaveParseResult;
}

const MandatoryLeaveImportDialog = ({
  onOpenChange,
  selectedYear,
  onImported,
}: MandatoryLeaveImportDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] =
    useState<MandatoryLeaveParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const resetState = () => {
    setSelectedFile(null);
    setParseResult(null);
    setIsParsing(false);
    setIsImporting(false);
  };

  const closeDialog = () => {
    resetState();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if ((isParsing || isImporting) && !nextOpen) {
      return;
    }

    if (!nextOpen) {
      closeDialog();
      return;
    }

    onOpenChange(nextOpen);
  };

  const parsedRows = useMemo(() => parseResult?.parsed ?? [], [parseResult]);
  const rejectedRows = useMemo(
    () => parseResult?.rejected ?? [],
    [parseResult],
  );

  const importPayload = useMemo<MandatoryLeaveImportPayload>(
    () => ({
      holidays: parsedRows
        .filter((row) => !row.already_exists)
        .map((row) => ({
          name: row.name,
          date: row.date,
          description: row.description ?? "",
          source: row.source ?? "",
        })),
    }),
    [parsedRows],
  );

  const importableCount = importPayload.holidays.length;
  const summary = parseResult?.summary;

  const selectedFileKind = selectedFile ? getFileKind(selectedFile) : null;
  const summaryCards = [
    {
      label: "Total rows",
      value: summary?.total_rows ?? 0,
      color: "#2563eb",
      icon: FileSpreadsheet,
    },
    {
      label: "Parsed",
      value: summary?.parsed_count ?? 0,
      color: "#16a34a",
      icon: CheckCircle2,
    },
    {
      label: "Rejected",
      value: summary?.rejected_count ?? 0,
      color: "#dc2626",
      icon: FileWarning,
    },
    {
      label: "Already exists",
      value: summary?.existing_count ?? 0,
      color: "#ca8a04",
      icon: Sparkles,
    },
    {
      label: "Importable",
      value: importableCount,
      color: "#7c3aed",
      icon: Upload,
    },
  ];
  const workflowSteps = [
    {
      title: "Select source file",
      description: selectedFile
        ? "The selected source file is attached and ready for parsing."
        : "Upload CSV, TSV, TXT, PSV, or a text-based PDF export.",
      state: selectedFile ? "complete" : "current",
    },
    {
      title: "Parse and review",
      description: parseResult
        ? `${summary?.parsed_count ?? 0} valid row${(summary?.parsed_count ?? 0) === 1 ? "" : "s"} parsed and ${summary?.rejected_count ?? 0} rejected row${(summary?.rejected_count ?? 0) === 1 ? "" : "s"} flagged.`
        : "Generate a preview before any rows are imported.",
      state: parseResult ? "complete" : selectedFile ? "current" : "upcoming",
    },
    {
      title: "Confirm import",
      description: parseResult
        ? `${importableCount} new holiday${importableCount === 1 ? "" : "s"} can be submitted after review.`
        : "Only clean, non-existing rows are sent to the holiday import endpoint.",
      state: parseResult ? "current" : "upcoming",
    },
  ] as const;

  const importReadiness = !parseResult
    ? {
        label: selectedFile ? "Source file ready" : "Awaiting source file",
        description: selectedFile
          ? "Your file is attached. Run the parser to inspect valid, duplicate, and rejected rows."
          : "Add a structured source file to start the holiday import workflow.",
        badgeClass:
          "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/12 dark:text-slate-200",
        icon: FileSpreadsheet,
      }
    : importableCount > 0
      ? {
          label: "Ready to import",
          description: `${importableCount} new holiday${importableCount === 1 ? "" : "s"} can be imported after review.`,
          badgeClass:
            "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/12 dark:text-emerald-200",
          icon: CheckCircle2,
        }
      : rejectedRows.length > 0
        ? {
            label: "Needs correction",
            description:
              "No new holidays are ready yet. Review rejected rows or remove duplicates from the source file.",
            badgeClass:
              "border-red-200 bg-red-100 text-red-700 dark:border-red-500/20 dark:bg-red-500/12 dark:text-red-200",
            icon: TriangleAlert,
          }
        : {
            label: "No new rows",
            description:
              "The parser did not find any holidays that need to be added to the current year.",
            badgeClass:
              "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/12 dark:text-amber-200",
            icon: Sparkles,
          };

  const ReadinessIcon = importReadiness.icon;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setParseResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!getFileKind(file)) {
      event.target.value = "";
      setSelectedFile(null);
      showErrorToast("Unsupported file type. Upload CSV, TSV, TXT, or PDF.");
      return;
    }

    setSelectedFile(file);
  };

  const handleParse = async () => {
    if (!selectedFile || isParsing || isImporting) {
      return;
    }

    setIsParsing(true);

    try {
      const payload = await buildParsePayload(selectedFile);
      const response = await parseLeaveHolidayImport(payload);

      if (!response?.success) {
        setParseResult(null);
        showErrorToast(
          response?.message || "Failed to parse the uploaded file.",
        );
        return;
      }

      const nextParseResult = normalizeParseResult(response.data);

      setParseResult(nextParseResult);
      toast.success(response.message || "File parsed successfully.");
    } catch (error) {
      setParseResult(null);
      showErrorToast(
        getErrorMessage(error, "Failed to parse the uploaded file."),
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!importableCount || isParsing || isImporting) {
      return;
    }

    setIsImporting(true);
    let shouldClose = false;

    try {
      const response = await insertParsedHolidays(importPayload);

      if (!response.success) {
        showErrorToast(
          response?.message || "Failed to import mandatory leave data.",
        );
        return;
      }

      toast.success(
        response.message || "Mandatory leave imported successfully.",
      );
      await onImported();
      shouldClose = true;
    } catch (error) {
      showErrorToast(
        getErrorMessage(error, "Failed to import mandatory leave data."),
      );
    } finally {
      setIsImporting(false);
      if (shouldClose) {
        closeDialog();
      }
    }
  };

  return (
    <DialogContent
      onEscapeKeyDown={(event) => {
        if (isParsing || isImporting) {
          event.preventDefault();
        }
      }}
      onInteractOutside={(event) => {
        if (isParsing || isImporting) {
          event.preventDefault();
        }
      }}
      className="max-h-[95vh] w-full max-w-[calc(100vw-1rem)] overflow-hidden border-borderColor p-0 sm:max-w-[1180px] xl:max-w-[1320px] dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <div className="grid max-h-[95vh] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="relative overflow-hidden border-b border-borderColor dark:border-darkBorder">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#f7fff4_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_28%),linear-gradient(135deg,rgba(44,50,63,1)_0%,rgba(24,29,40,1)_100%)]" />
          <div className="relative px-5 py-5 sm:px-8 sm:py-7">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <div>
                <Badge className="border border-primary/20 bg-white/90 px-3 py-1 text-primary backdrop-blur dark:border-primary/20 dark:bg-darkPrimaryBg/75 dark:text-emerald-300">
                  Holiday parser
                </Badge>

                <DialogHeader className="mt-4 space-y-3">
                  <DialogTitle className="text-2xl font-semibold tracking-tight text-headingTextColor dark:text-darkTextPrimary">
                    Mandatory leave import
                  </DialogTitle>
                  <DialogDescription className="max-w-3xl text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                    Upload CSV, TSV, TXT, PSV, or text-based PDF files for{" "}
                    {selectedYear}. The parser previews valid, duplicate, and
                    rejected rows before anything is written to the holiday
                    registry.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <Badge className="border border-white/70 bg-white/90 px-3 py-1.5 text-headingTextColor dark:border-white/8 dark:bg-darkPrimaryBg/70 dark:text-darkTextPrimary">
                    Import target: {selectedYear}
                  </Badge>
                  <Badge className="border border-primary/15 bg-primary/10 px-3 py-1.5 text-primary dark:bg-primary/15">
                    Existing rows are auto-skipped
                  </Badge>
                  <Badge className="border border-white/70 bg-white/90 px-3 py-1.5 text-subTextColor dark:border-white/8 dark:bg-darkPrimaryBg/70 dark:text-darkTextSecondary">
                    File types: CSV, TSV, TXT, PSV, PDF
                  </Badge>
                </div>
              </div>

              <div className="rounded-[12px] border border-white/70 shadow-sm bg-white/90 p-5 backdrop-blur dark:border-white/8 dark:bg-darkPrimaryBg/70">
                <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                  Import readiness
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <ReadinessIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      {importReadiness.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                      {importReadiness.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={importReadiness.badgeClass}>
                    {selectedYear} workspace
                  </Badge>
                  {selectedFile ? (
                    <Badge className="border border-white/70 bg-white/90 dark:border-white/8 dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                      {formatFileSize(selectedFile.size)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-hidden px-5 py-5 sm:px-8 sm:py-6">
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
              {/* Choose */}
              <div className="rounded-[12px] border border-borderColor bg-white/95 p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[12px] bg-primary/10 p-3 text-primary">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        Choose and parse a source file
                      </p>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                        Upload a structured holiday export, run the parser, then
                        review the preview before import. Scanned image-only
                        PDFs may still be rejected by the backend.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[12px] w-32 border border-borderColor bg-bgSecondary/60 px-4 py-3 text-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                    <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                      Active year
                    </p>
                    <p className="mt-1 text-subTextColor dark:text-darkTextSecondary">
                      {selectedYear}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="rounded-[12px] border border-dashed border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#f9fcff_100%)] p-4 sm:p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(40,46,59,1)_0%,rgba(27,32,43,1)_100%)]">
                    <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Source upload
                    </p>
                    <p className="mt-1 text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                      Prefer text-based exports for the cleanest parse results.
                      PDFs are encoded as base64 before the request is sent.
                    </p>

                    <Input
                      type="file"
                      accept={FILE_ACCEPT}
                      onChange={handleFileChange}
                      className="mt-4 cursor-pointer border-borderColor bg-white dark:border-darkBorder dark:bg-darkPrimaryBg"
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      <Badge className="max-w-full truncate border border-white/70 bg-white px-3 py-1.5 text-headingTextColor dark:border-white/8 dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                        <span className="block max-w-[420px] truncate">
                          {selectedFile
                            ? selectedFile.name
                            : "No file selected"}
                        </span>
                      </Badge>
                      {selectedFileKind ? (
                        <Badge className="border border-primary/15 bg-primary/10 px-3 py-1.5 text-primary dark:bg-primary/15">
                          {selectedFileKind === "pdf"
                            ? "PDF / base64"
                            : "Text / raw content"}
                        </Badge>
                      ) : null}
                      {selectedFile ? (
                        <Badge className="border border-white/70 bg-white px-3 py-1.5 text-subTextColor dark:border-white/8 dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                          {formatFileSize(selectedFile.size)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[12px] border border-borderColor bg-bgSecondary/60 p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
                    <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Parser notes
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                      <div className="rounded-[12px] bg-white px-4 py-3 dark:bg-darkPrimaryBg">
                        CSV, TSV, TXT, and PSV files are read as plain text.
                      </div>
                      <div className="rounded-[12px] bg-white px-4 py-3 dark:bg-darkPrimaryBg">
                        Duplicate holidays remain visible in the preview but are
                        excluded from import.
                      </div>
                      <div className="rounded-[12px] bg-white px-4 py-3 dark:bg-darkPrimaryBg">
                        Rejected rows stay blocked until the source file is
                        corrected and re-parsed.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handleParse}
                    disabled={!selectedFile || isParsing || isImporting}
                    className="h-11 rounded-2xl px-5 text-headingTextColor sm:min-w-[190px]"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Parsing file
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Parse file
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline2"
                    onClick={handleImport}
                    disabled={
                      !parseResult ||
                      !importableCount ||
                      isParsing ||
                      isImporting
                    }
                    className="h-11 rounded-2xl border-borderColor px-5 dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextPrimary sm:min-w-[250px]"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Importing holidays
                      </>
                    ) : (
                      `Step 2. Confirm import (${importableCount})`
                    )}
                  </Button>
                </div>
              </div>

              {/*  side */}
              <div className="space-y-4">
                <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    Import checklist
                  </p>
                  <div className="mt-4 space-y-3">
                    {workflowSteps.map((step, index) => (
                      <div
                        key={step.title}
                        className={`rounded-[12px] border p-4 ${
                          step.state === "complete"
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                            : step.state === "current"
                              ? "border-primary/20 bg-primary/10 dark:border-primary/20 dark:bg-primary/10"
                              : "border-borderColor bg-bgSecondary/45 dark:border-darkBorder dark:bg-darkSecondaryBg"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                              step.state === "complete"
                                ? "bg-emerald-500 text-white"
                                : step.state === "current"
                                  ? "bg-primary text-headingTextColor"
                                  : "bg-white text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary"
                            }`}
                          >
                            {step.state === "complete" ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                              {step.title}
                            </p>
                            <p className="mt-1 break-words text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Session snapshot
                    </p>
                    <Badge className={importReadiness.badgeClass}>
                      {importReadiness.label}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-[12px] bg-bgSecondary/60 px-4 py-3 dark:bg-darkSecondaryBg">
                      <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                        Selected file
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {selectedFile ? selectedFile.name : "No file selected"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[12px] bg-bgSecondary/60 px-4 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                          Parsed
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {summary?.parsed_count ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-bgSecondary/60 px-4 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                          Importable
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-primary">
                          {importableCount}
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-bgSecondary/60 px-4 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                          Existing
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-amber-500">
                          {summary?.existing_count ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-bgSecondary/60 px-4 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                          Rejected
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-red-500">
                          {summary?.rejected_count ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* parsed */}
            {parseResult ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {summaryCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                            {item.label}
                          </p>
                          <div
                            className="rounded-[12px] p-2"
                            style={{
                              backgroundColor: `${item.color}14`,
                              color: item.color,
                            }}
                          >
                            <Icon className="size-4" />
                          </div>
                        </div>
                        <p
                          className="mt-3 text-3xl font-semibold"
                          style={{ color: item.color }}
                        >
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                  <div className="rounded-[12px]border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          Parsed preview
                        </h3>
                        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                          Existing holidays remain visible for review and are
                          excluded from the final import request.
                        </p>
                      </div>
                      <div className="shrink-0 whitespace-nowrap rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/15">
                        Only valid, non-existing rows are submitted.
                      </div>
                    </div>

                    {parsedRows.length ? (
                      <>
                        <div className="grid gap-4 lg:hidden">
                          {parsedRows.map((row) => (
                            <div
                              key={`${row.row}-${row.name}-${row.date}`}
                              className="rounded-[12px] border border-borderColor bg-bgSecondary/40 p-4 dark:border-darkBorder dark:bg-darkSecondaryBg"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Row {row.row}: {row.name}
                                  </p>
                                  <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    {row.date}
                                  </p>
                                </div>
                                <Badge
                                  className={getParsedStatusClasses(
                                    row.already_exists,
                                  )}
                                >
                                  {getParsedStatusLabel(row.already_exists)}
                                </Badge>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-white px-3 py-3 text-sm dark:bg-darkPrimaryBg">
                                  <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                    Source
                                  </p>
                                  <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {row.source || "-"}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white px-3 py-3 text-sm dark:bg-darkPrimaryBg">
                                  <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                    Date
                                  </p>
                                  <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {row.date}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                                {row.description || "No description provided."}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hidden lg:block">
                          <Table className="min-w-[900px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Row</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {parsedRows.map((row) => (
                                <TableRow
                                  key={`${row.row}-${row.name}-${row.date}`}
                                >
                                  <TableCell>{row.row}</TableCell>
                                  <TableCell>{row.name}</TableCell>
                                  <TableCell>{row.date}</TableCell>
                                  <TableCell className="max-w-[320px] whitespace-normal text-subTextColor dark:text-darkTextSecondary">
                                    {row.description || "-"}
                                  </TableCell>
                                  <TableCell>{row.source || "-"}</TableCell>
                                  <TableCell>
                                    <Badge
                                      className={getParsedStatusClasses(
                                        row.already_exists,
                                      )}
                                    >
                                      {getParsedStatusLabel(row.already_exists)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-[12px] border border-dashed border-borderColor px-4 py-12 text-center text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                        No valid rows were parsed from the selected file.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          Rejected rows
                        </h3>
                        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                          These rows are blocked from import until the source
                          file is corrected.
                        </p>
                      </div>
                      <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-500/12 dark:text-red-200">
                        <TriangleAlert className="size-4" />
                        {rejectedRows.length} rejected
                      </div>
                    </div>

                    {rejectedRows.length ? (
                      <>
                        <div className="grid gap-4 lg:hidden">
                          {rejectedRows.map((row, index) => (
                            <div
                              key={`${row.row}-${index}`}
                              className="rounded-[12px] border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Row {row.row}
                                  </p>
                                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                    {row.reason}
                                  </p>
                                </div>
                                <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-400/20 dark:bg-red-500/12 dark:text-red-200">
                                  Rejected
                                </Badge>
                              </div>

                              <div className="mt-4 rounded-2xl bg-white px-3 py-3 text-xs text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                                <pre className="whitespace-pre-wrap break-words font-sans">
                                  {previewRawValue(row.raw)}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hidden lg:block">
                          <Table className="min-w-[760px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Row</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Raw preview</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rejectedRows.map((row, index) => (
                                <TableRow key={`${row.row}-${index}`}>
                                  <TableCell>{row.row}</TableCell>
                                  <TableCell className="max-w-[280px] whitespace-normal">
                                    {row.reason}
                                  </TableCell>
                                  <TableCell className="max-w-[420px] whitespace-normal text-xs text-subTextColor dark:text-darkTextSecondary">
                                    <pre className="whitespace-pre-wrap break-words font-sans">
                                      {previewRawValue(row.raw)}
                                    </pre>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-[12px] border border-dashed border-borderColor px-4 py-12 text-center text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                        No rejected rows. The parsed dataset is clean.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[12px] border border-dashed border-borderColor bg-white/70 px-6 py-12 text-center dark:border-darkBorder dark:bg-darkPrimaryBg">
                <p className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Parse a source file to unlock the review workspace
                </p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                  After parsing, this modal will show summary metrics, duplicate
                  detection, and rejected-row diagnostics in a wider review
                  layout.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-borderColor px-5 py-4 dark:border-darkBorder sm:flex-row sm:justify-between sm:px-8">
          <Button
            variant="outline2"
            onClick={() => handleOpenChange(false)}
            disabled={isParsing || isImporting}
            className="h-11 rounded-2xl border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
          >
            Close
          </Button>
          <Button
            onClick={handleImport}
            className="h-11 rounded-2xl px-5 text-headingTextColor"
            disabled={
              !parseResult || !importableCount || isParsing || isImporting
            }
          >
            {isImporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Importing holidays
              </>
            ) : (
              `Import ${importableCount} holiday${importableCount === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  );
};

export default MandatoryLeaveImportDialog;
