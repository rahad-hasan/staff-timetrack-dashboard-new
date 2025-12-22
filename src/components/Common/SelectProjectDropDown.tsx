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
import { getProjects } from "@/actions/projects/action"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

const SelectProjectDropDown = () => {
    const [value, setValue] = useState<string | null>(null)
    console.log('got it', value);
    const [open, setOpen] = useState(false)
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchInput, setSearchInput] = useState("")

    useEffect(() => {
        // Wait 500ms after the user stops typing before calling the action
        const delayDebounceFn = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await getProjects({ search: searchInput })

                if (res?.success) {
                    const formatted = res?.data?.map((p: any) => ({
                        value: String(p?.id),
                        label: p?.name,
                        avatar: p?.image || ""
                    }))
                    setProjects(formatted)
                }
            } catch (err) {
                console.error("Fetch error:", err)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchInput])

    const handleSelect = (currentValue: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (currentValue === value) {
            setValue("");
            params.delete("project_id");
        } else {
            setValue(currentValue);
            params.set("project_id", currentValue);
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        setOpen(false);
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
                                <AvatarImage src={projects.find((p) => p?.value === value)?.avatar} alt={value} />
                                <AvatarFallback className="bg-gray-100">{projects.find((p) => p.value === value)?.label?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="truncate max-w-[150px]">
                            {value ? projects.find((p) => p.value === value)?.label : "Select Project..."}
                        </span>
                    </div>
                    <DownArrow size={16} />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
                <Command className="dark:bg-darkSecondaryBg">
                    <CommandInput placeholder="Search Project..." className="h-9"
                        value={searchInput}
                        onValueChange={setSearchInput}
                    />
                    <CommandList>
                        <CommandEmpty>{loading ? "Loading..." : "No project found."}</CommandEmpty>
                        <CommandGroup>
                            {projects.map((project: any) => (
                                <CommandItem
                                    key={project?.value}
                                    value={project?.label}
                                    onSelect={() => handleSelect(project?.value)}
                                    className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                                >
                                    <Avatar className="w-6 h-6 mr-2">
                                        <AvatarImage src={project?.avatar} alt={project?.label} />
                                        <AvatarFallback>{project?.label.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {project?.label}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === project?.value ? "opacity-100" : "opacity-0"
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