/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
 
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
 
export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}
 
export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get("refreshToken")?.value;
}
 
export async function refreshAccessTokenFromServer() {
  const res = await fetch("{{base_url}}/api/v1/auth/refresh-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    // body: JSON.stringify({
    //   refreshToken: await getRefreshToken(),
    // }),
  });
 
  if (!res.ok) {
    throw new Error("Something went wrong fetch access token");
  }
 
  const { success, accessToken, refreshToken, message } = await res.json();
 
  if (!success) {
    throw new Error(message);
  }
 
  if (success) {
    const cookieStore = await cookies();
    cookieStore.set("accessToken", accessToken, { secure: true });
    cookieStore.set("refreshToken", refreshToken, { secure: true });
  }
}
 
export async function recallTheApi(callback: (data?: any) => Promise<any>) {
  await refreshAccessTokenFromServer();
  return await callback();
}
 
export async function getHeaders(isFormData: boolean = false) {
  const token = await getAccessToken();
 
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
 
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
 
  return headers;
}
 
export async function getMembers(query: string) {
  async function childFn() {
    return await fetch("http://localhost:5000/api/v1/dashboard/members", {
      headers: await getHeaders(),
      next: {
        tags: ["members"],
      },
    });
  }
 
  let res = await childFn();
 
  if (res.status === 401) {
    res = await recallTheApi(childFn);
  }
 
  if (!res.ok) {
    throw new Error("Something went wrong fetch members from api");
  }
 
  const result = await res.json();
 
  return result;
}
 
export async function addMember(data: any) {
  const res = await fetch("http://localhost:5000/api/v1/dashboard/members", {
    headers: await getHeaders(),
    method: "POST",
    body: JSON.stringify(data),
  });
 
  if (!res.ok) {
    throw new Error("Something went wrong when add member");
  }
 
  revalidateTag("members");
 
  const result = await res.json();
 
  return result;
}
 