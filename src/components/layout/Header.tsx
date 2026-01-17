/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "../ui/button";
// import downloadIcon from '../../assets/header/download.svg'
// import startTimerIcon from '../../assets/header/start_timer_icon.svg'
// import Image from "next/image";
import {
    Popover,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CirclePlay, Download, Menu, } from "lucide-react";
import StartTimer from "./Header/StartTimer";
import {
    Sheet,
    SheetTrigger,
} from "@/components/ui/sheet"
import MobileSidebar from "./MobileSidebar";
import DarkMoodToggle from "./Header/DarkMoodToogle";
import ProfileDropDown from "./Header/ProfileDropDown";
import Notification from "./Header/Notification";
import Link from "next/link";
import { useEffect, useState } from "react";
import { socket } from "@/socket/socket";
// import bellIcon from '../../assets/header/bell.svg'

const Header = () => {
    const [open, setOpen] = useState(false);
    console.log('header rendered');
    const [notificationsList, setNotificationsList] = useState<any[]>([]);
    const unreadCount = notificationsList.filter(n => n.is_read === false).length;
    console.log(unreadCount);

    useEffect(() => {
        // 2. Listen for real-time notifications
        const handleIncomingData = (data: any) => {
            console.log("Socket Data Received:", data);
            // Assuming your backend returns an array or an object with a data property
            const newList = Array.isArray(data) ? data : data?.data || [];
            console.log("got it", newList);
            setNotificationsList(newList);
        };
        socket.on("notifications", handleIncomingData);
        // 3. Initial fetch if socket is already connected
        // if (socket.connected) {
        //     socket.emit("notifications", { page: 1, limit: 10 });
        // }
        return () => {
            socket.off("notifications", handleIncomingData);
        };
    }, []);

    // console.log(notificationsList);


    return (
        <div className=" border-b border-borderColor dark:border-darkBorder py-3 md:py-3.5 2xl:py-5 px-3 md:px-5 flex items-center justify-between rounded-t-lg dark:bg-darkPrimaryBg">
            <div>
                <Popover open={open} onOpenChange={setOpen} modal>
                    <PopoverTrigger asChild>
                        {/* <Button className=" px-2 sm:px-3 dark:border-darkBorder" variant={'filter'}><Image src={startTimerIcon} width={0} height={0} className=" w-7 lg:w-5" alt="download" /><span className=" hidden lg:block dark:text-darkTextPrimary">Start Timer</span></Button> */}
                        <Button className=" dark:border-darkBorder dark:hover:bg-darkSecondaryBg" variant={'filter'}><CirclePlay className="text-primary size-5.5 sm:size-5.5" /><span className=" hidden lg:block dark:text-darkTextPrimary">Start Timer</span></Button>
                    </PopoverTrigger>
                    <StartTimer onClose={() => setOpen(false)}></StartTimer>
                </Popover>
            </div>

            <div className=" hidden md:flex items-center gap-4">
                <div>
                    <DarkMoodToggle></DarkMoodToggle>
                </div>
                <div className="border-x-2 border-borderColor dark:border-darkBorder px-3">
                    <Notification unreadCount={unreadCount} notificationsList={notificationsList}></Notification>
                </div>
                <div className="hidden lg:block ">
                    {/* <Button className=" dark:border-primary " variant={'outline'}><Image src={downloadIcon} width={0} height={0} className="w-5" alt="download" />Download App</Button> */}
                    <Link href={`/download`}>
                        <Button className=" dark:border-primary dark:hover:bg-darkSecondaryBg" variant={'outline'}><Download className=" text-primary w-8" />Download App</Button>
                    </Link>
                </div>
                <ProfileDropDown></ProfileDropDown>
            </div>

            {/* mobile menu */}
            <div className=" flex items-center gap-4 md:hidden">
                <div>
                    <DarkMoodToggle></DarkMoodToggle>
                </div>

                <div className="">
                    <Notification></Notification>
                </div>

                <ProfileDropDown></ProfileDropDown>
                <Sheet>
                    <SheetTrigger asChild><Menu className=" cursor-pointer " size={20} /></SheetTrigger>
                    <MobileSidebar></MobileSidebar>
                </Sheet>
            </div>

        </div >
    );
};

export default Header;