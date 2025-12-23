import { PopoverContent } from "@/components/ui/popover";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import MyProfileIcon from "@/components/Icons/MyProfileIcon";
import InviteMemberIcon from "@/components/Icons/InviteMemberIcon";
import CustomerSupportIcon from "@/components/Icons/CustomerSupportIcon";
import ReferFriendIcon from "@/components/Icons/ReferFriendIcon";
import SubscriptionIcon from "@/components/Icons/SubscriptionIcon";
import PauseNotificationIcon from "@/components/Icons/PauseNotificationIcon";
import SignOutIcon from "@/components/Icons/SignOutIcon";
import { useRouter } from "next/navigation";
import { clearSessionCookie } from "@/actions/auth/action";
import { useLogInUserStore } from "@/store/logInUserStore";

const ProfilePopoverContent = ({ side, align }: { side: "top" | "right" | "bottom" | "left", align: "center" | "end" | "start" }) => {
    const router = useRouter();
    const { resetData } = useLogInUserStore();

    const handleLogOut = async () => {
        try {
            await clearSessionCookie();
            resetData();
            router.push('/auth/login');
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }
    return (
        <PopoverContent className=" px-0 shadow-none py-3 border-borderColor dark:border-darkBorder" side={side} align={align}>
            <div className="flex items-center gap-2 mb-4 px-3 ">
                <Avatar className="w-12 h-12">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-bold text-xl">Dannielis Vettori</h4>
                    <div className=" flex items-center gap-2 mt-1">
                        <span className="bg-[#5db0f1] text-white text-[12px]  px-2 py-1 rounded-full">Super admin</span>
                        <span className="bg-[#12cd69] text-white text-[12px] px-2 py-1 rounded-full">Starter plan</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 mb-2 px-3 pt-2 border-t border-borderColor dark:border-darkBorder">
                <button className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer">
                    <MyProfileIcon size={18} /> My account
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer">
                    <InviteMemberIcon size={18} /> Invite member to team
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer">
                    <CustomerSupportIcon size={18} /> Customer Support
                </button>
                {/* <button className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer">
                    <Plug size={18} /> Integration
                </button> */}
                <button className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer">
                    <ReferFriendIcon size={18} /> Refer a friend
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer">
                    <SubscriptionIcon size={18} /> Subscription
                </button>
            </div>
            <div className="border-t border-borderColor dark:border-darkBorder mt-2 pt-3.5 flex flex-col gap-2 px-3">
                <button className="flex items-center text-headingTextColor dark:text-darkTextPrimary border-borderColor dark:border-darkBorder gap-2 text-sm font-medium border w-full px-3.5 hover:bg-gray-100 hover:dark:bg-darkPrimaryBg py-2 rounded-md cursor-pointer">
                    <PauseNotificationIcon size={18} /> Pause notification
                </button>
                {/* <Link className="hover:bg-gray-100 hover:dark:bg-darkPrimaryBg rounded-md cursor-pointer" href={`/`}> */}
                <button onClick={handleLogOut} className="flex items-center font-medium gap-2 border border-borderColor dark:border-darkBorder w-full px-3.5 text-sm hover:bg-gray-100 hover:dark:bg-darkPrimaryBg text-red-500 py-2 rounded-md cursor-pointer">
                    <SignOutIcon size={18} /> Sign out
                </button>
                {/* </Link> */}
            </div>
        </PopoverContent>
    );
};

export default ProfilePopoverContent;