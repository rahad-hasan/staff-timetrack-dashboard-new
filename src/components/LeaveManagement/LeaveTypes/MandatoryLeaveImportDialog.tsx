"use client";

import axios from "axios";
import { Loader2, TriangleAlert, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
const FILE_ACCEPT = ".csv,.tsv,.txt,.text,.psv,.pdf,text/csv,text/plain,application/pdf";

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
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
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });
}

async function buildParsePayload(file: File): Promise<MandatoryLeaveParsePayload> {
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

function normalizeParseResult(data: Partial<MandatoryLeaveParseResult> | null | undefined) {
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
  const [parseResult, setParseResult] = useState<MandatoryLeaveParseResult | null>(null);
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
  const rejectedRows = useMemo(() => parseResult?.rejected ?? [], [parseResult]);

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
      const response = await axios.post("/api/leave-management/mandatory-leaves/import/parse", payload);

      if (!response.data?.success) {
        setParseResult(null);
        showErrorToast(response.data?.message || "Failed to parse the uploaded file.");
        return;
      }

      const nextParseResult = normalizeParseResult(response.data.data);

      setParseResult(nextParseResult);
      toast.success(response.data.message || "File parsed successfully.");
    } catch (error) {
      setParseResult(null);
      showErrorToast(getErrorMessage(error, "Failed to parse the uploaded file."));
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
      const response = await axios.post(
        "/api/leave-management/mandatory-leaves/import",
        importPayload,
      );

      if (!response.data?.success) {
        showErrorToast(response.data?.message || "Failed to import mandatory leave data.");
        return;
      }

      toast.success(response.data.message || "Mandatory leave imported successfully.");
      await onImported();
      shouldClose = true;
    } catch (error) {
      showErrorToast(getErrorMessage(error, "Failed to import mandatory leave data."));
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
      className="w-full max-w-[1100px] border-borderColor p-0 dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="border-b border-borderColor p-6 dark:border-darkBorder">
          <DialogHeader>
            <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
              Mandatory leave import
            </DialogTitle>
            <DialogDescription>
              Upload CSV, TSV, TXT, or text-based PDF files for {selectedYear}. PDFs are converted
              to base64 on the client before parsing, and scanned image-only PDFs may be rejected by
              the backend parser.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-[24px] border border-borderColor bg-bgSecondary/50 p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                  Step 1. Choose a source file
                </p>
                <p className="text-sm text-subTextColor">
                  Supported inputs: CSV, TSV, semicolon-delimited text, pipe-delimited text, and
                  text-based PDF.
                </p>
              </div>

              <div className="w-full max-w-[360px]">
                <Input
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={handleFileChange}
                  className="cursor-pointer dark:border-darkBorder dark:bg-darkSecondaryBg"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-full bg-white px-3 py-1.5 text-headingTextColor dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                {selectedFile ? selectedFile.name : "No file selected"}
              </div>
              {selectedFile ? (
                <div className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                  {getFileKind(selectedFile) === "pdf" ? "PDF / base64" : "Text / raw content"}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleParse} disabled={!selectedFile || isParsing || isImporting}>
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
                disabled={!parseResult || !importableCount || isParsing || isImporting}
                className="dark:bg-darkSecondaryBg"
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

          {parseResult ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: "Total rows",
                    value: summary?.total_rows ?? 0,
                    color: "#2563eb",
                  },
                  {
                    label: "Parsed",
                    value: summary?.parsed_count ?? 0,
                    color: "#16a34a",
                  },
                  {
                    label: "Rejected",
                    value: summary?.rejected_count ?? 0,
                    color: "#dc2626",
                  },
                  {
                    label: "Already exists",
                    value: summary?.existing_count ?? 0,
                    color: "#ca8a04",
                  },
                  {
                    label: "Importable",
                    value: importableCount,
                    color: "#7c3aed",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Parsed preview
                    </h3>
                    <p className="text-sm text-subTextColor">
                      Existing holidays are highlighted and excluded from the final import request.
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                    Only valid, non-existing rows are submitted.
                  </div>
                </div>

                {parsedRows.length ? (
                  <Table>
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
                        <TableRow key={`${row.row}-${row.name}-${row.date}`}>
                          <TableCell>{row.row}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal text-subTextColor">
                            {row.description || "-"}
                          </TableCell>
                          <TableCell>{row.source || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                row.already_exists
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {row.already_exists ? "Already exists" : "Ready to import"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-2xl border border-dashed border-borderColor px-4 py-12 text-center text-subTextColor dark:border-darkBorder">
                    No valid rows were parsed from the selected file.
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Rejected rows
                    </h3>
                    <p className="text-sm text-subTextColor">
                      These rows are blocked from import until the source file is corrected.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    <TriangleAlert className="size-4" />
                    {rejectedRows.length} rejected
                  </div>
                </div>

                {rejectedRows.length ? (
                  <Table>
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
                          <TableCell className="max-w-[420px] whitespace-normal text-xs text-subTextColor">
                            <pre className="whitespace-pre-wrap break-words font-sans">
                              {previewRawValue(row.raw)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-2xl border border-dashed border-borderColor px-4 py-12 text-center text-subTextColor dark:border-darkBorder">
                    No rejected rows. The parsed dataset is clean.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="border-t border-borderColor px-6 py-4 dark:border-darkBorder">
          <Button
            variant="outline2"
            onClick={() => handleOpenChange(false)}
            disabled={isParsing || isImporting}
            className="dark:bg-darkPrimaryBg"
          >
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || !importableCount || isParsing || isImporting}
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
