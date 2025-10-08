import { Button } from "../ui/button";
import downloadIcon from '../../assets/header/download.svg'
import startTimerIcon from '../../assets/header/start_timer_icon.svg'
import bellIcon from '../../assets/header/bell.svg'
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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
                {/* <Popover>
                    <PopoverTrigger><Button variant={'outline2'} className=" py-[5px]"><Image src={`https://avatar.iran.liara.run/public/18`} width={200} height={200} className="w-8 rounded-full" alt="download" />Dannielis Vettori <ChevronDown size={20} /></Button></PopoverTrigger>
                    <PopoverContent>Place content for the popover here.</PopoverContent>
                </Popover> */}
            </div>

        </div >
    );
};

export default Header;



// import { Button } from "../ui/button";
// import downloadIcon from '../../assets/header/download.svg'
// import startTimerIcon from '../../assets/header/start_timer_icon.svg'
// import bellIcon from '../../assets/header/bell.svg'
// import Image from "next/image";
// import { BellOff, ChevronDown, CreditCard, Headset, LogOut, Plug, Share2, User, UserPlus } from "lucide-react";
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from "@/components/ui/popover"

// const Header = () => {

//     return (
//         <div className=" border-b-2 border-borderColor py-5 px-5 flex items-center justify-between">
//             <div>
//                 <Button variant={'outline2'}><Image src={startTimerIcon} width={0} height={0} className="w-5" alt="download" />Start Timer</Button>
//             </div>

//             <div className=" flex items-center gap-4">
//                 <div className="border-x-2 border-borderColor px-3">
//                     <div className="relative w-7 h-7 cursor-pointer">
//                         <Image
//                             src={bellIcon}
//                             fill
//                             className="object-contain"
//                             alt="notification bell"
//                         />
//                         {/* Red dot */}
//                         <span className="absolute top-[1px] right-[4px] w-1.5 h-1.5 bg-red-600 rounded-full"></span>
//                     </div>
//                 </div>
//                 <Button variant={'outline'}><Image src={downloadIcon} width={0} height={0} className="w-5" alt="download" />Download App</Button>
//                 <Popover>
//                     <PopoverTrigger><Button variant={'outline2'} className=" py-[5px]"><Image src={`https://avatar.iran.liara.run/public/18`} width={200} height={200} className="w-8 rounded-full" alt="download" />Dannielis Vettori <ChevronDown size={20} /></Button></PopoverTrigger>
//                     <PopoverContent>
//                         <div className="flex items-center gap-3 mb-4">
//                             <Image
//                                 src="https://avatar.iran.liara.run/public/18"
//                                 alt="Dannielis Vettori"
//                                 width={48}
//                                 height={48}
//                                 className="rounded-full w-16"
//                             />
//                             <div>
//                                 <h4 className="font-semibold text-xl">Dannielis Vettori</h4>
//                                 <div className=" flex items-center gap-2 mt-1">
//                                     <span className="bg-[#5db0f1] text-white text-sm  px-1 py-1 rounded-full">Super admin</span>
//                                     <span className="bg-[#12cd69] text-white text-sm px-1 py-1 rounded-full">Starter plan</span>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="flex flex-col gap-2 mb-2">
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <User size={16} /> My account
//                             </button>
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <UserPlus size={16} /> Invite member to team
//                             </button>
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <Headset size={16} /> Customer Support
//                             </button>
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <Plug size={16} /> Integration
//                             </button>
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <Share2 size={16} /> Refer a friend
//                             </button>
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <CreditCard size={16} /> Subscription
//                             </button>
//                         </div>
//                         <div className="border-t border-gray-200 mt-2 pt-2 flex flex-col gap-2">
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <BellOff size={16} /> Pause notification
//                             </button>
//                             <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-2 rounded-md">
//                                 <LogOut size={16} /> Sign out
//                             </button>
//                         </div>
//                     </PopoverContent>
//                 </Popover>
//             </div>
//         </div >
//     );
// };

// export default Header;