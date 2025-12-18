import { ssrBaseApi } from "@/api/ssrBaseApi";
import { buildQuery } from "@/utils/buildQuery";

export async function getAllProject(query = {}) {
    const queryString = buildQuery(query);
    // console.log('query built from buildQuery', queryString);
    return ssrBaseApi(`/projects${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
    });
}
