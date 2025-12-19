"use server";
import { cookies } from "next/headers";
const isProd = process.env.NODE_ENV === "production";
const BASE_URL = "http://localhost:5000/api/v1";

export async function getRefreshToken() {
    const cookieStore = await cookies();
    return cookieStore.get("refreshToken")?.value;
}

export async function refreshAccessTokenFromServer() {
    const token = await getRefreshToken();
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `refreshToken=${token}`, // forward cookie
        },
        credentials: "include",
        cache: "no-store",
    });

    console.log("🔁 Refresh status:", res.status);

    const text = await res.text();
    console.log("🔁 Refresh response:", text);

    if (!res.ok) {
        throw new Error("Failed to refresh access token");
    }

    const { success, data, message } = JSON.parse(text);

    if (!success) {
        throw new Error(message || "Refresh token invalid");
    }

    const cookieStore = await cookies();
    cookieStore.set("accessToken", data?.accessToken, {
        httpOnly: true,
        secure: isProd,
        path: "/",
    });
    cookieStore.set("refreshToken", data?.refreshToken, {
        httpOnly: true,
        secure: isProd,
        path: "/",
    });
}
