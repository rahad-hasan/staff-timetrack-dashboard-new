import { toast } from "sonner";

export const downloadPayrollExport = async (runId: number) => {
  const url = `/api/payroll/export/${runId}`;

  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      let message = `Export failed (${response.status})`;
      try {
        const data = await response.json();
        message = data?.message ?? message;
      } catch {
        /* not json */
      }
      toast.error(message);
      return;
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    const filename = filenameMatch?.[1] ?? `payroll-run-${runId}.csv`;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    toast.success("Export downloaded.");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Export failed. Please try again.",
    );
  }
};
