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

const SelectUserDropDown = ({ userId }: { userId?: string | number }) => {
    console.log("userId", userId);
    console.log('render😐😐😐😐😐');
    const [value, setValue] = useState<string | null>(userId ? String(userId) : null)
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [searchInput, setSearchInput] = useState("")

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

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
    }, [])

    // Memoize selected user for display efficiency
    const selectedUser = useMemo(() =>
        users.find((u) => u.id === value),
        [users, value])


    // Sync internal state AND URL parameters when userId prop is available
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (userId) {
            const stringId = String(userId);
            setValue(stringId);

            // Only update URL if it's not already set to this ID to avoid infinite loops
            if (params.get("user_id") !== stringId) {
                params.set("user_id", stringId);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        } else {
            // Optional: If you want to clear the URL when the prop is null
            if (params.has("user_id")) {
                setValue(null);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }
    }, [userId, pathname, router]); // searchParams is omitted to prevent unnecessary triggers


    const handleSelect = (currentId: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (currentId === value) {
            setValue(null)
            params.delete("user_id")
        } else {
            setValue(currentId)
            params.set("user_id", currentId)
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
                                <AvatarFallback className="">
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