"use client"
import SearchBar from "@/components/Common/SearchBar";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams } from "next/navigation";

const LeaveRequestHeading = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isRejected = searchParams.get("rejected") === "true";
    const isApproved = searchParams.get("approved") === "true";

    const updateQueryParam = (key: string, value: string | boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("rejected");
        params.delete("approved");
        if (value && value !== "false") {
            params.set(key, String(value));
            params.set("page", "1");
        } else {
            params.delete(key);
        }

        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between gap-5">

            <div className="flex items-center gap-5">
                <div className="flex gap-1 items-center">
                    <Checkbox
                        id="rejected"
                        className="cursor-pointer border-primary"
                        checked={isRejected}
                        onCheckedChange={(checked) => updateQueryParam("rejected", checked)}
                    />
                    <label htmlFor="rejected" className="cursor-pointer text-sm mt-0.5">Rejected Request</label>
                </div>

                <div className="flex gap-1 items-center">
                    <Checkbox
                        id="approved"
                        className="cursor-pointer border-primary"
                        checked={isApproved}
                        onCheckedChange={(checked) => updateQueryParam("approved", checked)}
                    />
                    <label htmlFor="approved" className="cursor-pointer text-sm mt-0.5">Approved Request</label>
                </div>
            </div>

            <SearchBar onSearch={(query) => updateQueryParam("search", query)} />
        </div>
    );
};

export default LeaveRequestHeading;