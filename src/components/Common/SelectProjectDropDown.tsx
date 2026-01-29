/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DownArrow from "@/components/Icons/DownArrow";
import { getProjects } from "@/actions/projects/action";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useTopLoader } from "nextjs-toploader";

type ProjectOption = {
  value: string;
  label: string;
  avatar?: string;
};

const SelectProjectDropDown = () => {
  const loader = useTopLoader();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("project_id");
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await getProjects({ search: debouncedSearch });

        if (res?.success) {
          const apiProjects = res.data.map((p: any) => ({
            value: String(p.id),
            label: p.name,
            avatar: p.image || "",
          }));
          setProjects([
            { value: "", label: "All Project", avatar: "" },
            ...apiProjects
          ]);
        }
      } catch (err) {
        console.error("Fetch projects error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [debouncedSearch]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.value === selectedProjectId),
    [projects, selectedProjectId]
  );

  const handleSelect = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (projectId === selectedProjectId) {
      params.delete("project_id");
    } else {
      params.set("project_id", projectId);
    }
    loader.start()
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline2"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[250px] h-10 bg-[#f6f7f9] flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedProject && (
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={selectedProject.avatar} />
                <AvatarFallback>
                  {selectedProject.label.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="truncate max-w-[150px]">
              {selectedProject ? selectedProject.label : "Select Project..."}
            </span>
          </div>
          <DownArrow size={16} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
        <Command className="dark:bg-darkSecondaryBg">
          <CommandInput
            placeholder="Search Project..."
            className="h-9"
            value={searchInput}
            onValueChange={setSearchInput}
          />

          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No project found."}
            </CommandEmpty>

            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.value}
                  value={project.label}
                  onSelect={() => handleSelect(project.value)}
                  className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                >
                  <Avatar className="w-6 h-6 mr-2 shrink-0">
                    <AvatarImage src={project.avatar} />
                    <AvatarFallback>
                      {project.label.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <span className="truncate">{project.label}</span>

                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      selectedProjectId === project.value
                        ? "opacity-100"
                        : "opacity-0"
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

export default React.memo(SelectProjectDropDown);
