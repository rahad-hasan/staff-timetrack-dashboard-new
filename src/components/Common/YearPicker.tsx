"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface YearPickerProps {
    startYear?: number;
    endYear?: number;
    value?: string;
    onYearChange: (year: string) => void;
}

export function YearPicker({
    startYear = 1900,
    endYear = new Date().getFullYear(),
    value,
    onYearChange
}: YearPickerProps) {

    // Generate years from end to start (descending)
    const years = React.useMemo(() => {
        const list = []
        for (let i = endYear; i >= startYear; i--) {
            list.push(i.toString())
        }
        return list
    }, [startYear, endYear])

    return (
        <Select value={value} onValueChange={onYearChange}>
            <SelectTrigger className="w-[220px] font-medium">
                <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                    <SelectItem key={year} value={year}>
                        {year}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}