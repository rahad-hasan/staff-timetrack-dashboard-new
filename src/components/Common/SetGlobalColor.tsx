"use client"

import { useColorStore } from "@/store/globalColorStore";
import { useEffect } from "react";

const SetGlobalColor = () => {
    const { color } = useColorStore();
    console.log(color);
    useEffect(() => {
        document.documentElement.style.setProperty("--primary", color);
    }, [color]);

    return (
        <div />
    );
};

export default SetGlobalColor;