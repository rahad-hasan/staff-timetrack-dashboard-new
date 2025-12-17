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
  } = {},
  retry = true // prevent infinite loop
) {

  const doFetch = async (): Promise<Response> => {
    const token = Cookies.get("accessToken"); // read fresh token every time
    console.log('from my cookies😭', token);
    const options: RequestInit & { next?: { revalidate?: number } } = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      cache,
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    };

    return fetch(`http://localhost:5000/api/v1${endpoint}`, options);
  };


  // const token = Cookies.get("accessToken");

  // const options: RequestInit & { next?: { revalidate?: number } } = {
  //   method,
  //   headers: {
  //     "Content-Type": "application/json",
  //     ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //   },
  //   body: data ? JSON.stringify(data) : undefined,
  //   cache,
  // };

  // if (revalidate !== undefined) {
  //   options.next = { revalidate }; // ISR support
  // }

  // const doFetch = async () => await fetch(
  //   // `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
  //   `http://localhost:5000/api/v1${endpoint}`,
  //   options
  // );

  const res = await doFetch();

  if (res?.status === 401 && retry) {
    const refreshRes = await fetch(`http://localhost:5000/api/v1/auth/refresh-token`, {
      method: "POST",
      credentials: "include"
    });
    const jsonRefresh = await refreshRes.json()
    console.log('Yes, you are Unauthorized');
    console.log('got the token from backend',);
    // if (!jsonRefresh?.success) {
    //   Cookies.remove("accessToken");
    //   Cookies.remove("refreshToken");
    //   window.location.href = "/";
    //   throw new Error("Session expired");
    // }
    if (jsonRefresh?.success) {
      // Cookies.set("accessToken", jsonRefresh?.data?.accessToken);
      Cookies.set("accessToken", jsonRefresh.data.accessToken, {
        path: "/",          // 🔴 REQUIRED
        sameSite: "lax",
      });

      // Cookies.set("refreshToken", jsonRefresh?.data?.refreshToken);
    }
    return baseApi(endpoint, { method, data, cache, revalidate }, false);
  }
  // Cookies.set("accessToken", res?.data?.accessToken);
  return res.json();
}
