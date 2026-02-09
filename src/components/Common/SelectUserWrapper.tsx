/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getMembersDashboard } from "@/actions/members/action";
import SelectUserDropDown from "./SelectUserDropDown";

const SelectUserWrapper = ({ defaultSelect }: { defaultSelect?: boolean }) => {
    const [users, setUsers] = useState<{ id: string; label: any; avatar: string }[]>([]);
    const [loading, setLoading] = useState(false);
    console.log("Component loaded");
    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            console.log("fetchMembers fired");
            try {
                const res = await getMembersDashboard();
                if (res?.success) {
                    const formatted = res?.data?.map((u: any) => ({
                        id: String(u?.id),
                        label: u?.name,
                        avatar: u?.image || u?.avatar || "",
                    }));
                    setUsers(formatted);
                }
            } catch (err) {
                console.error("Fetch members error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, []);

    return <SelectUserDropDown users={users} defaultSelect={defaultSelect} loading={loading} />;
};

export default SelectUserWrapper;
