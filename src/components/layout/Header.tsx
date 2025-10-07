import { Button } from "../ui/button";
import downloadIcon from '../../assets/header/download.svg'
import startTimerIcon from '../../assets/header/start_timer_icon.svg'
import bellIcon from '../../assets/header/bell.svg'
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const Header = () => {

    return (
        <div className=" border-b-2 border-borderColor py-5 px-5 flex items-center justify-between">
            <div>
                <Button variant={'outline2'}><Image src={startTimerIcon} width={0} height={0} className="w-5" alt="download" />Start Timer</Button>
            </div>

            <div className=" flex items-center gap-4">
                <div className="border-x-2 border-borderColor px-3">
                    <div className="relative w-7 h-7 cursor-pointer">
                        <Image
                            src={bellIcon}
                            fill
                            className="object-contain"
                            alt="notification bell"
                        />
                        {/* Red dot */}
                        <span className="absolute top-[1px] right-[4px] w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    </div>
                </div>
                <Button variant={'outline'}><Image src={downloadIcon} width={0} height={0} className="w-5" alt="download" />Download App</Button>
                <Button variant={'outline2'} className=" py-[5px]"><Image src={`https://avatar.iran.liara.run/public/18`} width={200} height={200} className="w-8 rounded-full" alt="download" />Dannielis Vettori <ChevronDown size={20} /></Button>
            </div>
        </div>
    );
};

export default Header;