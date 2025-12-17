import { ssrBaseApi } from "@/api/ssrBaseApi";
import { buildQuery } from "@/utils/buildQuery";

export async function getAllClient(query = {}) {
    const queryString = buildQuery(query);
    return ssrBaseApi(`/clients${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
    });
}
