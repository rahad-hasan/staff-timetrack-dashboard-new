/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"


const SelectUserDropDown = ({users}:any) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline2"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full sm:w-[250px] h-10 bg-[#f6f7f9] flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
                >
                    <div className=" flex justify-between items-center gap-3">
                        {value && (
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={users.find((user:any) => user.value === value)?.avatar} alt={value} />
                                <AvatarFallback>{users.find((user:any) => user.value === value)?.label.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="">
                            {value
                                ? users.find((user:any) => user.value === value)?.label
                                : "Select User..."}
                        </span>
                    </div>
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
                <Command className="dark:bg-darkSecondaryBg">
                    <CommandInput placeholder="Search User..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                            {users.map((user:any) => (
                                <CommandItem
                                    key={user.value}
                                    className="cursor-pointer hover:dark:bg-darkSecondaryBg"
                                    value={user.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <div>
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={user.avatar} alt={user.label} />
                                            <AvatarFallback>{user.label.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    {user.label}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === user.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default SelectUserDropDown;