"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function StatusSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentStatus = searchParams.get("status") || "";

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value && value !== "all") {
            params.set("status", value);
        } else {
            params.delete("status");
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Select value={currentStatus} onValueChange={handleValueChange}>
            <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {/* <SelectItem value="all">All Status</SelectItem> */}
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}