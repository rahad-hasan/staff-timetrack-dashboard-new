import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Salaries: no browser, proxy or CDN may keep a copy of any answer from this
// route — the file itself or an error about it. Next adds no Cache-Control of
// its own to a route handler's response.
const NO_STORE = { "Cache-Control": "private, no-store" };

const failure = (message: string, status: number) =>
  NextResponse.json(
    { success: false, message },
    { status, headers: NO_STORE },
  );

/**
 * The API's message from an error response. Its raw body (a JSON envelope or
 * an HTML error page) used to be passed through, and the export button showed
 * it verbatim in a toast.
 */
const upstreamMessage = async (upstream: Response) => {
  if (upstream.headers.get("content-type")?.includes("application/json")) {
    const payload = await upstream.json().catch(() => null);
    const message = payload?.message ?? payload?.errorMessages?.[0]?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return `Export failed with status ${upstream.status}`;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const parsedRunId = Number(runId);
  if (!parsedRunId || Number.isNaN(parsedRunId)) {
    return failure("Invalid run id", 400);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return failure("Not authenticated", 401);
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return failure("API base URL is not configured", 500);
  }

  let upstream: Response;
  let file: ArrayBuffer;
  try {
    upstream = await fetch(
      `${baseUrl}/api/v1/payroll/run/${parsedRunId}/export?format=csv`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!upstream.ok) {
      return failure(await upstreamMessage(upstream), upstream.status);
    }

    // Read in full before answering: a transfer that breaks halfway must
    // surface as a failed export, never as a truncated CSV saved as complete.
    file = await upstream.arrayBuffer();
  } catch {
    return failure(
      "Couldn't reach the payroll service. Please try again.",
      502,
    );
  }

  const headers = new Headers(NO_STORE);
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
  );
  const disposition =
    upstream.headers.get("content-disposition") ??
    `attachment; filename="payroll-run-${parsedRunId}.csv"`;
  headers.set("Content-Disposition", disposition);

  return new NextResponse(file, {
    status: 200,
    headers,
  });
}
