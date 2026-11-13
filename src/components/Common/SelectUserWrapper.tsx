"use client";

import { useMemo } from "react";
import SelectUserDropDown from "./SelectUserDropDown";
import { useSearchParams } from "next/navigation";
import { useDashboardMembers } from "@/hooks/useDashboardMembers";

const SelectUserWrapper = ({ defaultSelect }: { defaultSelect?: boolean }) => {
    const searchParams = useSearchParams();
    // Narrowed to the URL's project when one is selected. The hook drops a
    // response for a project the user has already switched away from.
    const { members, loading } = useDashboardMembers(
        searchParams.get("project_id"),
    );

    // Stable between renders so the memoised dropdown only re-renders when
    // the list itself changes.
    const users = useMemo(
        () =>
            members.map((member) => ({
                id: String(member.id),
                label: member.name,
                avatar: member.image || "",
            })),
        [members],
    );

    return <SelectUserDropDown users={users} defaultSelect={defaultSelect} loading={loading} />;
};

export default SelectUserWrapper;
