import { Button } from "../ui/button";
// import downloadIcon from '../../assets/header/download.svg'
// import startTimerIcon from '../../assets/header/start_timer_icon.svg'
import bellIcon from '../../assets/header/bell.svg'
import Image from "next/image";
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


const Header = () => {
    console.log('header rendered');

    return (
        <div className=" border-b-2 border-borderColor dark:border-darkBorder py-3 md:py-5 px-3 md:px-5 flex items-center justify-between rounded-t-lg dark:bg-darkPrimaryBg">
            <div>
                <Popover>
                    <PopoverTrigger asChild>
                        {/* <Button className=" px-2 sm:px-3 dark:border-darkBorder" variant={'filter'}><Image src={startTimerIcon} width={0} height={0} className=" w-7 lg:w-5" alt="download" /><span className=" hidden lg:block dark:text-darkTextPrimary">Start Timer</span></Button> */}
                        <Button className=" dark:border-darkBorder " variant={'filter'}><CirclePlay className="text-primary size-5.5 sm:size-5.5"/><span className=" hidden lg:block dark:text-darkTextPrimary">Start Timer</span></Button>
                    </PopoverTrigger>
                    <StartTimer></StartTimer>
                </Popover>
            </div>

            <div className=" hidden md:flex items-center gap-4">

                <div>
                    <DarkMoodToggle></DarkMoodToggle>
                </div>
                <div className="border-x-2 border-borderColor dark:border-darkBorder px-3">
                    <div className="relative w-6 h-6 cursor-pointer">
                        <Image
                            src={bellIcon}
                            fill
                            className="object-contain bell-icon"
                            alt="notification bell"
                        />
                        {/* <Bell className=" dark:text-darkTextPrimary" /> */}
                        {/* Red dot */}
                        <span className="absolute top-[1px] right-[3px] w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    </div>
                </div>
                <div className="hidden lg:block ">
                    {/* <Button className=" dark:border-primary " variant={'outline'}><Image src={downloadIcon} width={0} height={0} className="w-5" alt="download" />Download App</Button> */}
                    <Button className=" dark:border-primary " variant={'outline'}><Download className=" text-primary w-8" />Download App</Button>
                </div>
                <ProfileDropDown></ProfileDropDown>
            </div>
            {/* mobile menu */}
            <div className=" flex items-center gap-4 md:hidden">
                <div>
                    <DarkMoodToggle></DarkMoodToggle>
                </div>
                <div className="">
                    <div className="relative w-[25px] h-[25px] cursor-pointer">
                        <Image
                            src={bellIcon}
                            fill
                            className="object-contain bell-icon"
                            alt="notification bell"
                        />
                        {/* Red dot */}
                        <span className="absolute top-[1px] right-[4px] w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    </div>
                </div>

                <ProfileDropDown></ProfileDropDown>
                <Sheet>
                    <SheetTrigger asChild><Menu className=" cursor-pointer" size={25} /></SheetTrigger>
                    <MobileSidebar></MobileSidebar>
                </Sheet>
            </div>

        </div >
    );
};

export default Header;