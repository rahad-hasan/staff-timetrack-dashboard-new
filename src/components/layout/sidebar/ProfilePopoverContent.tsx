"use client";
import { PopoverClose, PopoverContent } from "@/components/ui/popover";
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
import { useProfileImage } from "@/hooks/useProfileImage";
import Link from "next/link";
import { useSidebarStore } from "@/store/sidebarStore";
import TourMenuItem from "@/components/Onboarding/TourMenuItem";
import { useMemberInviteStore } from "@/store/memberInviteStore";
import { MANAGEMENT_ROLES } from "@/lib/onboarding/registry";
import { BILLING_URL } from "@/lib/billing";
import { MARKETING_SITE_URL } from "@/lib/siteLinks";

/** Every row in the menu shares one look — keep it in one place. */
const MENU_ITEM_CLASS =
    "flex w-full items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-2 py-2 rounded-md cursor-pointer";

const ProfilePopoverContent = ({ side, align }: { side: "top" | "right" | "bottom" | "left", align: "center" | "end" | "start" }) => {
    const router = useRouter();
    const { resetSidebar } = useSidebarStore();
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    const requestInvite = useMemberInviteStore(state => state.requestInvite);
    const { src: profileImageSrc, handleLoadingStatusChange } = useProfileImage();

    // Members and billing are both admin / manager / hr only — `/settings/billing`
    // bounces everyone else back to `/settings` and `POST /auth/employees` is
    // gated the same way, so hiding the rows beats a dead end.
    const role = logInUserData?.role as string | undefined;
    const isManagement = (MANAGEMENT_ROLES as readonly string[]).includes(role ?? "");

    const handleLogOut = async () => {
        try {
            await clearSessionCookie();
            resetSidebar();
            router.push('/auth/login');
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    // Leave the intent in the store and navigate: `MemberHeroSection` claims it
    // on mount and opens the Add Member dialog over the list, so the new member
    // lands in a page that already shows the team.
    const handleInviteMember = () => {
        requestInvite();
        router.push("/members");
    };

    return (
        <PopoverContent className=" px-0 shadow-none py-3 border-borderColor dark:border-darkBorder" side={side} align={align}>
            <div className="flex items-center gap-2 mb-4 px-3 ">
                <Avatar className="w-14 h-14">
                    <AvatarImage src={profileImageSrc} onLoadingStatusChange={handleLoadingStatusChange} alt={logInUserData?.name || "Profile"} />
                    <AvatarFallback className=" dark:bg-darkPrimaryBg/70">
                        {logInUserData?.name && logInUserData?.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-bold text-xl">{logInUserData?.name}</h4>
                    <div className=" flex items-center gap-2 mt-1">
                        <span className="bg-[#5db0f1] capitalize text-white text-[12px]  px-2 py-1 rounded-full">{logInUserData?.role}</span>
                        <span className="bg-[#12cd69] text-white text-[12px] px-2 py-1 rounded-full">Starter plan</span>
                    </div>
                </div>
            </div>
            {/* Every row closes the popover on its way out: Radix keeps content
                open on an inside click, which used to leave the menu floating
                over the page the user just navigated to. */}
            <div className="flex flex-col gap-2 mb-2 px-3 pt-2 border-t border-borderColor dark:border-darkBorder">
                <PopoverClose asChild>
                    <Link className={MENU_ITEM_CLASS} href="/settings">
                        <MyProfileIcon size={18} /> My account
                    </Link>
                </PopoverClose>
                {isManagement && (
                    <PopoverClose asChild>
                        <button type="button" onClick={handleInviteMember} className={MENU_ITEM_CLASS}>
                            <InviteMemberIcon size={18} /> Add member to team
                        </button>
                    </PopoverClose>
                )}
                <PopoverClose asChild>
                    <Link className={MENU_ITEM_CLASS} href="/support/tickets">
                        <CustomerSupportIcon size={18} /> Customer Support
                    </Link>
                </PopoverClose>
                <PopoverClose asChild>
                    <a
                        className={MENU_ITEM_CLASS}
                        href={MARKETING_SITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ReferFriendIcon size={18} /> Refer a friend
                    </a>
                </PopoverClose>
                {isManagement && (
                    <PopoverClose asChild>
                        <Link className={MENU_ITEM_CLASS} href={BILLING_URL}>
                            <SubscriptionIcon size={18} /> Subscription
                        </Link>
                    </PopoverClose>
                )}
                <TourMenuItem className={MENU_ITEM_CLASS} />
            </div>
            <div className="border-t border-borderColor dark:border-darkBorder mt-2 pt-3.5 flex flex-col gap-2 px-3">
                <button type="button" className="flex items-center text-headingTextColor dark:text-darkTextPrimary border-borderColor dark:border-darkBorder gap-2 text-sm font-medium border w-full px-3.5 hover:bg-gray-100 hover:dark:bg-darkPrimaryBg py-2 rounded-md cursor-pointer">
                    <PauseNotificationIcon size={18} /> Pause notification
                </button>
                <button type="button" onClick={handleLogOut} className="flex items-center font-medium gap-2 border border-borderColor dark:border-darkBorder w-full px-3.5 text-sm hover:bg-gray-100 hover:dark:bg-darkPrimaryBg text-red-500 py-2 rounded-md cursor-pointer">
                    <SignOutIcon size={18} /> Sign out
                </button>
            </div>
        </PopoverContent>
    );
};

export default ProfilePopoverContent;
