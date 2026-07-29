"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import AttendanceHeroSearch from "./AttendanceHeroSearch";
import AttendanceTable from "./AttendanceTable";

const AttendanceServer = ({ attendanceListData }: any) => {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div>
            <div className="flex items-center justify-between w-full mb-5">
                <div className="flex flex-col items-end md:flex-row gap-4 md:gap-3 w-full">
                    <SpecificDatePicker />
                    <AttendanceHeroSearch onSearchChange={setSearchTerm} />
                </div>
            </div>
            <AttendanceTable attendanceListData={attendanceListData} searchTerm={searchTerm}></AttendanceTable>
        </div>
    );
};

export default AttendanceServer;