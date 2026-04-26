"use client"

import { addDays, format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useState, useCallback } from "react"
import CalendarIcon from "../Icons/CalendarIcon"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTopLoader } from "nextjs-toploader"

const SelectDateRange = ({defaultDateShow = true}: {defaultDateShow?:boolean}) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const loader = useTopLoader()

    const formatDateToISO = (date: Date) => {
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, "0")
        const dd = String(date.getDate()).padStart(2, "0")
        return `${yyyy}-${mm}-${dd}`
    }

    const today = new Date()

    // init from URL OR default
    const [date, setDate] = useState<DateRange | undefined>(() => {
        const fromParam = searchParams.get("from_date")
        const toParam = searchParams.get("to_date")

        if (fromParam && toParam) {
            return {
                from: new Date(fromParam),
                to: new Date(toParam),
            }
        }
        if (defaultDateShow) {
            return {
                from: today,
                to: addDays(today, 6),
            }
        }

        return undefined
    })


    const handleSelect = useCallback(
        (range: DateRange | undefined) => {
            setDate(range)

            if (!range?.from || !range?.to) return

            const params = new URLSearchParams(window.location.search)

            const fromStr = formatDateToISO(range.from)
            const toStr = formatDateToISO(range.to)

            params.set("from_date", fromStr)
            params.set("to_date", toStr)
            params.delete("date")

            loader.start()
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            })
        },
        [pathname, router, loader]
    )

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex h-10 items-center font-medium cursor-pointer gap-2 border dark:border-darkBorder dark:bg-darkPrimaryBg rounded-md px-2 sm:px-4">
                    <CalendarIcon className="text-primary" size={20} />

                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                    ) : (
                        <span className=" font-normal">Pick a date range</span>
                    )}
                </div>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    )
}

export default SelectDateRange;