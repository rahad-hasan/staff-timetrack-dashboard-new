/* eslint-disable @typescript-eslint/no-explicit-any */
export async function baseApi(
  endpoint: string,
  {
    method = "GET",
    data,
    token,
    cache = "no-store",     // ⬅ DEFAULT: secure
    revalidate,
  }: {
    method?: string;
    data?: any;
    token?: string;
    cache?: RequestCache;
    revalidate?: number;
  } = {}
) {
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

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
