/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from "js-cookie";
export async function baseApi(
  endpoint: string,
  {
    method = "GET",
    data,
    cache = "no-store",     // ⬅ DEFAULT: secure
    revalidate,
  }: {
    method?: string;
    data?: any;
    cache?: RequestCache;
    revalidate?: number;
  } = {}
) {

  const token = Cookies.get("accessToken");

  const options: RequestInit & { next?: { revalidate?: number } } = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    cache,
  };

  if (revalidate !== undefined) {
    options.next = { revalidate }; // ISR support
  }

  const res = await fetch(
    // `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    `http://localhost:5000/api/v1${endpoint}`,
    options
  );

  return res.json();
}
