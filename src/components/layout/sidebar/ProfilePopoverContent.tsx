import { PopoverContent } from "@/components/ui/popover";
import { BellOff, CreditCard, Headset, LogOut, Plug, Share2, User, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ProfilePopoverContent = ({side, align}: { side: "top" | "right" | "bottom" | "left", align:  "center" | "end" | "start"}) => {
    return (
        <PopoverContent side={side} align={align}>
            <div className="flex items-center gap-3 mb-4">
                <Image
                    src="https://avatar.iran.liara.run/public/18"
                    alt="Dannielis Vettori"
                    width={48}
                    height={48}
                    className="rounded-full w-16"
                />
                <div>
                    <h4 className="font-semibold text-xl">Dannielis Vettori</h4>
                    <div className=" flex items-center gap-2 mt-1">
                        <span className="bg-[#5db0f1] text-white text-[12px]  px-2 py-1 rounded-full">Super admin</span>
                        <span className="bg-[#12cd69] text-white text-[12px] px-2 py-1 rounded-full">Starter plan</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 mb-2">
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <User size={16} /> My account
                </button>
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <UserPlus size={16} /> Invite member to team
                </button>
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <Headset size={16} /> Customer Support
                </button>
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <Plug size={16} /> Integration
                </button>
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <Share2 size={16} /> Refer a friend
                </button>
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <CreditCard size={16} /> Subscription
                </button>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex flex-col gap-2">
                <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                    <BellOff size={16} /> Pause notification
                </button>
                <Link className="hover:bg-gray-100 hover:dark:bg-darkSecondaryBg rounded-md cursor-pointer" href={`/auth/signIn`}>
                    <button className="flex items-center gap-2 text-sm hover:bg-gray-100 hover:dark:bg-darkSecondaryBg px-2 py-2 rounded-md cursor-pointer">
                        <LogOut size={16} /> Sign out
                    </button>
                </Link>
            </div>
        </PopoverContent>
    );
};

export default ProfilePopoverContent;