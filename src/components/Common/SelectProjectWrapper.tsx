"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { getProjects } from "@/actions/projects/action";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { useDebounce } from "@/hooks/use-debounce";

type ProjectOption = {
    value: string;
    label: string;
    avatar?: string;
};

const SelectProjectWrapper = () => {
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 500);

    const fetchProjects = useCallback(async (searchQuery: string) => {
        setLoading(true);
        try {
            const res = await getProjects({ search: searchQuery });

            if (res?.success) {
                const apiProjects = res.data.map((p: any) => ({
                    value: String(p.id),
                    label: p.name,
                    avatar: p.image || "",
                }));

                setProjects([
                    { value: "", label: "All Project", avatar: "" },
                    ...apiProjects,
                ]);
            }
        } catch (err) {
            console.error("Fetch projects error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Trigger on Mount AND when debouncedSearch changes
    useEffect(() => {
        fetchProjects(debouncedSearch);
    }, [debouncedSearch]);

    return (
        <SelectProjectDropDown
            projects={projects}
            loading={loading}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
        />
    );
};

export default SelectProjectWrapper;
