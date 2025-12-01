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


const SelectProjectDropDown = ({ projects, value, setValue }: any) => {
    const [open, setOpen] = useState(false)

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
                                <AvatarImage src={projects.find((project: any) => project.value === value)?.avatar} alt={value} />
                                <AvatarFallback>{projects.find((project: any) => project.value === value)?.label.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="">
                            {value
                                ? projects.find((project: any) => project.value === value)?.label
                                : "Select Project..."}
                        </span>
                    </div>
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
                <Command className="dark:bg-darkSecondaryBg">
                    <CommandInput placeholder="Search Project..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No project found.</CommandEmpty>
                        <CommandGroup>
                            {projects.map((project: any) => (
                                <CommandItem
                                    key={project.value}
                                    className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                                    value={project.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <div>
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={project.avatar} alt={project.label} />
                                            <AvatarFallback>{project.label.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    {project.label}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === project.value ? "opacity-100" : "opacity-0"
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

export default SelectProjectDropDown;