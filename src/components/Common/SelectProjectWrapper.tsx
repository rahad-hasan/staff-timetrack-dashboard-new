"use client";
import { useEffect, useState } from "react";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { useDebounce } from "@/hooks/use-debounce";
import { readLiveJson } from "@/lib/readLiveJson";

type ProjectOption = {
  value: string;
  label: string;
  avatar?: string;
};

/** Served by src/app/api/projects/dropdown/route.ts. */
const PROJECTS_URL = "/api/projects/dropdown";

const SelectProjectWrapper = () => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Trigger on Mount AND when debouncedSearch changes. The read for a search
  // the user has already typed past is cancelled, so a slow earlier answer
  // cannot replace the results for the current one.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    readLiveJson<{ id: number; name: string; image?: string | null }[]>(
      PROJECTS_URL,
      { query: { search: debouncedSearch }, signal: controller.signal },
    ).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.success && Array.isArray(res.data)) {
        setProjects([
          { value: "all", label: "All Project", avatar: "" },
          ...res.data.map((p) => ({
            value: String(p.id),
            label: p.name,
            avatar: p.image || "",
          })),
        ]);
      }
      setLoading(false);
    });

    return () => controller.abort();
  }, [debouncedSearch]);

  return (
    <div className=" w-full">
      <SelectProjectDropDown
        projects={projects}
        loading={loading}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
      />
    </div>
  );
};

export default SelectProjectWrapper;
