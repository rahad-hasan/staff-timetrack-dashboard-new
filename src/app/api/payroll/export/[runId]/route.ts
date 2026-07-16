import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const parsedRunId = Number(runId);
  if (!parsedRunId || Number.isNaN(parsedRunId)) {
    return NextResponse.json(
      { success: false, message: "Invalid run id" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API base URL is not configured" },
      { status: 500 },
    );
  }

  const upstream = await fetch(
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
    const message = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        success: false,
        message: message || `Export failed with status ${upstream.status}`,
      },
      { status: upstream.status },
    );
  }

  const buffer = await upstream.arrayBuffer();

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
  );
  const disposition =
    upstream.headers.get("content-disposition") ??
    `attachment; filename="payroll-run-${parsedRunId}.csv"`;
  headers.set("Content-Disposition", disposition);

  return new NextResponse(buffer, {
    status: 200,
    headers,
  });
}
