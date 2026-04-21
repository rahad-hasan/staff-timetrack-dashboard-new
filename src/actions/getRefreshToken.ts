"use server";

import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/apiConfig";

export async function getRefreshToken() {
    const cookieStore = await cookies();
    return cookieStore.get("refreshToken")?.value;
}

export async function refreshAccessTokenFromServer() {
    const token = await getRefreshToken();
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `refreshToken=${token}`, // forward cookie
        },
        credentials: "include",
        cache: "no-store",
    });
    if (res.ok) {
        const result = await res.json();
        const { accessToken } = result.data;
        return accessToken; // Return the new token to use it immediately
    }

    return null;

}
