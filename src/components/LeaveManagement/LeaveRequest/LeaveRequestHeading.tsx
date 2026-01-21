"use client"
import SearchBar from "@/components/Common/SearchBar";
import { useRouter, useSearchParams } from "next/navigation";

const LeaveRequestHeading = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const handleSearch = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("search", query);
        router.push(`?${params.toString()}`);
    };
    return (
        <div>
             <SearchBar onSearch={handleSearch} />
        </div>
    );
};

export default LeaveRequestHeading;