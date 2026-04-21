import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { API_BASE_URL } from "@/lib/apiConfig";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 401,
        data: null,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/leaves/holidays/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({
      success: false,
      statusCode: response.status,
      data: null,
      message: `Request failed with ${response.status}`,
    }));

    if (response.ok && payload?.success) {
      revalidateTag("leave-holidays");
      revalidatePath("/leave-management/leave-types");
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        data: null,
        message: "Failed to import mandatory leave data.",
      },
      { status: 500 },
    );
  }
}
