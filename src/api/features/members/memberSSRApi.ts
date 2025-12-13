import { ssrBaseApi } from "@/api/ssrBaseApi";
import { buildQuery } from "@/utils/buildQuery";

export async function getAllMember(query = {}) {
    const queryString = buildQuery(query);
    console.log('query built from buildQuery', queryString);
    return ssrBaseApi(`/auth/employees${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
    });
}
