"use client"
import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import DailyTimeSheetsTable from "./DailyTimeSheetsTable";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import AppPagination from "@/components/Common/AppPagination";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";

const DailyTimeSheets = () => {
    const [value, setValue] = useState("")
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
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]
    const activePeriods = [
        { start: 5, end: 7, project: 'project', task: 'task', duration: '2:00:00' }, // Active from 5 AM to 7 AM
        { start: 13, end: 16, project: 'project', task: 'task', duration: '2:00:00' }, // Active from 1 PM to 4 PM
        { start: 18, end: 20, project: 'project', task: 'task', duration: '2:00:00' }, // Active from 6 PM to 8 PM
    ];

    // date picker
    const [selectedDate, setSelectedDate] = useState(new Date());
    console.log('selectedDate', selectedDate);
    const [page, setPage] = useState(1);
    console.log(page);
    return (
        <>
            <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between h-full">
                <div className=" flex flex-col sm:flex-col-reverse xl:flex-row gap-4 md:gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    {/* <div className="hidden md:block">
                        <Button className=" py-0 dark:text-darkTextPrimary" variant={'filter'}>
                            <SlidersHorizontal className=" dark:text-darkTextPrimary" /> Filters
                        </Button>
                    </div> */}
                    <SelectProjectDropDown projects={projects} setValue={setValue} value={value}></SelectProjectDropDown>
                </div>
                {/* <div className=" "> */}
                    {/* <Select onValueChange={setUser} value={user ?? undefined}>
                        <SelectTrigger size={'lg'} className="w-full">
                            {selectedUser ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                        <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{selectedUser.name}</span>
                                </div>
                            ) : (
                                <SelectValue placeholder="Select user" />
                            )}
                        </SelectTrigger>

                        <SelectContent>
                            <Input
                                type="text"
                                placeholder="Search user..."
                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                            {filteredUsers.map(t => (
                                <SelectItem className="px-3 flex items-center gap-2" key={t.name} value={t.name}>
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={t.avatar} alt={t.name} />
                                        <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="ml-2">{t.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select> */}
                    <SelectUserDropDown users={users}></SelectUserDropDown>
                {/* </div> */}
            </div>

            <div className=" mb-5">
                <div className=" flex gap-2 mb-2">
                    <h1 className=" font-bold text-headingTextColor dark:text-darkTextPrimary">Today:</h1>
                    <p className="text-headingTextColor dark:text-darkTextPrimary">6:00:00</p>
                </div>
                <div className="relative h-5 bg-bgSecondary dark:bg-darkPrimaryBg rounded-4xl border border-borderColor dark:border-darkBorder">
                    {activePeriods.map((period, index) => {
                        const startPercent = (period.start / 24) * 100;
                        const endPercent = (period.end / 24) * 100;
                        const width = endPercent - startPercent;

                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <div
                                        key={index}
                                        className="absolute h-5 bg-primary rounded-4xl"
                                        style={{
                                            left: `${startPercent}%`,
                                            width: `${width}%`,
                                        }}
                                    ></div>
                                </TooltipTrigger>
                                <TooltipContent className=" bg-[#868686] dark:bg-darkSecondaryBg p-3">
                                    <div>
                                        <h2 className=" text-[15px] mb-2 dark:text-darkTextPrimary">Project: Orbit Technology’s Project</h2>
                                        <h2 className=" text-[15px] mb-2 dark:text-darkTextPrimary">Task: Front End Development</h2>
                                        <h2 className=" text-[15px] dark:text-darkTextPrimary">Duration: 2:00:00</h2>
                                    </div>
                                </TooltipContent>
                            </Tooltip>

                        );
                    })}
                </div>
                <div className="flex justify-between mt-[2px]">
                    {Array.from({ length: 24 }, (_, i) => {
                        const hour = i + 1;
                        // choose which hours to always show
                        const isAlwaysVisible = hour === 1 || hour === 6 || hour === 12 || hour === 18 || hour === 24;

                        return (
                            <span
                                key={i}
                                className={`text-sm text-gray-400 dark:text-darkTextSecondary
                                ${!isAlwaysVisible ? "hidden lg:inline xl:inline" : ""}
                                sm:first:ml-1
                                `}
                            >
                                {hour}h
                            </span>
                        );
                    })}
                </div>


            </div>
            <DailyTimeSheetsTable></DailyTimeSheetsTable>
            <AppPagination
                total={120}     // total items
                currentPage={page}
                limit={10}      // items per page
                onPageChange={setPage}
            />
        </>
    );
};

export default DailyTimeSheets;