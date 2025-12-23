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
import React, { useEffect, useState, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import DownArrow from "../Icons/DownArrow"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { getMembersDashboard } from "@/actions/members/action"

const SelectUserDropDown = () => {
    const [value, setValue] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    
    // searchInput is now used ONLY for the controlled input, not for triggering API
    const [searchInput, setSearchInput] = useState("")

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // 1. Fetch Users ONCE on mount
    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true)
            try {
                const res = await getMembersDashboard()
                if (res?.success) {
                    const formatted = res?.data?.map((u: any) => ({
                        id: String(u?.id), 
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
    }, []) // Empty dependency array = only runs once

    // Memoize selected user for display efficiency
    const selectedUser = useMemo(() => 
        users.find((u) => u.id === value), 
    [users, value])

    const handleSelect = (currentId: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (currentId === value) {
            setValue(null)
            params.delete("user_name")
        } else {
            setValue(currentId)
            // Assuming you want the ID or Label in the URL:
            params.set("user_name", currentId) 
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
                        {selectedUser && (
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={selectedUser.avatar} alt={selectedUser.label} />
                                <AvatarFallback className="bg-gray-100">
                                    {selectedUser.label?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <span className="truncate max-w-[150px]">
                            {selectedUser ? selectedUser.label : "Select User..."}
                        </span>
                    </div>
                    <DownArrow size={16} />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
                {/* 2. REMOVED shouldFilter={false} to enable default local search */}
                <Command className="dark:bg-darkSecondaryBg">
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
                                    key={user.id}
                                    // 3. The value prop here is what the local search filters against
                                    value={user.label} 
                                    onSelect={() => handleSelect(user.id)}
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
                                            value === user.id ? "opacity-100" : "opacity-0"
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

export default React.memo(SelectUserDropDown);