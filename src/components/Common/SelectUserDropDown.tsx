/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import DownArrow from "../Icons/DownArrow"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { getMembers } from "@/actions/members/action"

const SelectUserDropDown = () => {
    const [value, setValue] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchInput, setSearchInput] = useState("")

    const router = useRouter()
    const pathname = usePathname()
    console.log('sdfdsflsdjflsdjf', pathname);
    const searchParams = useSearchParams()

    // 2. Fetch Users with Debounce
    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true)
            try {
                // Fetch members based on search input
                const res = await getMembers({ search: searchInput })

                if (res?.success) {
                    const formatted = res?.data?.map((u: any) => ({
                        value: String(u?.name), // Using name as requested for the value
                        label: u?.name,
                        avatar: u?.image || u?.avatar || ""
                    }))
                    setUsers(formatted)
                }
            } catch (err) {
                console.error("Fetch members error:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchMembers()
    }, [searchInput])

    useEffect(() => {
        // If there are any search params at all, clear them on mount
        if (searchParams.toString()) {
            router.replace(pathname, { scroll: false });
        }
    }, []);

    // 3. Update URL and Local State on Selection
    const handleSelect = (currentValue: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (currentValue === value) {
            setValue("")
            params.delete("user_name")
        } else {
            setValue(currentValue)
            params.set("user_name", currentValue)
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline2"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full sm:w-[250px] h-10 bg-[#f6f7f9] flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
                >
                    <div className="flex justify-between items-center gap-3">
                        {value && (
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={users.find((u) => u?.value === value)?.avatar} alt={value} />
                                <AvatarFallback className="bg-gray-100">
                                    {users.find((u) => u.value === value)?.label?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <span className="truncate max-w-[150px]">
                            {value ? users.find((u) => u.value === value)?.label : "Select User..."}
                        </span>
                    </div>
                    <DownArrow size={16} />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
                {/* Important: shouldFilter={false} to allow server-side results to show */}
                <Command shouldFilter={false} className="dark:bg-darkSecondaryBg">
                    <CommandInput
                        placeholder="Search User..."
                        className="h-9"
                        value={searchInput}
                        onValueChange={setSearchInput}
                    />
                    <CommandList>
                        <CommandEmpty>{loading ? "Loading..." : "No user found."}</CommandEmpty>
                        <CommandGroup>
                            {users.map((user: any) => (
                                <CommandItem
                                    key={user?.value}
                                    value={user?.label}
                                    onSelect={() => handleSelect(user?.value)}
                                    className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                                >
                                    <Avatar className="w-6 h-6 mr-2">
                                        <AvatarImage src={user?.avatar} alt={user?.label} />
                                        <AvatarFallback>{user?.label.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {user?.label}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === user?.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default SelectUserDropDown