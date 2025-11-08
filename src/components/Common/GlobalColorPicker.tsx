/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useColorStore } from "@/store/globalColorStore";

const GlobalColorPicker = () => {
    const { color, setColor } = useColorStore();

    const handleColorChange = (e: any) => {
        const newColor = e.target.value;
        setColor(newColor);
    };
    return (
        <div className=" flex items-center gap-1">
            <span>Theme Color: {color}</span>
            <input
                type="color"
                className=" cursor-pointer"
                value={color}
                onChange={handleColorChange}
                style={{ width: "40px", height: "40px" }}
            />
        </div>
    );
};

export default GlobalColorPicker;