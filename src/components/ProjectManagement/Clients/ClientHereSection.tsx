"use client"

import { useEffect, useState } from "react";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { useRouter, useSearchParams } from "next/navigation";

const ClientHereSection = () => {
    const [value, setValue] = useState("")
    const searchParams = useSearchParams();
    const router = useRouter();
    useEffect(() => {
        if (!value) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("project", value);
        params.set("page", "1");

        router.push(`?${params.toString()}`);
    }, [value, searchParams, router]);
    
    useEffect(() => {
        // This runs once when the component mounts (on refresh)
        const params = new URLSearchParams(window.location.search);
        if (params.has("project")) {
            router.replace(window.location.pathname); // Removes all query strings
        }
    }, []); // Empty dependency array

    const projects = [
        {
            value: "Time Tracker",
            label: "Time Tracker",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "E-commerce",
            label: "E-commerce",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Fack News Detection",
            label: "Fack News Detection",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Travel Together",
            label: "Travel Together",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Time Tracker2",
            label: "Time Tracker2",
            avatar: "https://picsum.photos/200/300",
        },
    ]

    return (
        <div>
            <SelectProjectDropDown projects={projects} setValue={setValue} value={value}></SelectProjectDropDown>
        </div>
    );
};

export default ClientHereSection;