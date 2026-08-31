"use client"
import { Button } from "@/components/ui/button";
import { TOUR_ANCHORS } from "@/lib/onboarding/anchors";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import AddNewMemberModal from "./AddNewMemberModal";
import SearchBar from "../Common/SearchBar";
import HeadingComponent from "../Common/HeadingComponent";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemberInviteStore } from "@/store/memberInviteStore";

const MemberHeroSection = () => {
    const [open, setOpen] = useState(false)
    const router = useRouter();
    const searchParams = useSearchParams();

    const isInvitePending = useMemberInviteStore(state => state.isInvitePending);
    const consumeInvite = useMemberInviteStore(state => state.consumeInvite);

    // "Add member to team" (profile menu) navigates here and leaves the
    // intent in the store. Claim it exactly once — otherwise a later visit to
    // /members would reopen the dialog on its own.
    useEffect(() => {
        if (!isInvitePending) return;
        consumeInvite();
        setOpen(true);
    }, [isInvitePending, consumeInvite]);

    const handleSearch = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("search", query);
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Members" subHeading="All the member are displayed here"></HeadingComponent>

                <Dialog open={open} onOpenChange={setOpen}>
                    <form>
                        <DialogTrigger asChild>
                            <Button data-tour={TOUR_ANCHORS.ctaAddMember} className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Add Member</span></Button>
                        </DialogTrigger>
                        {/* remount on every open so the wizard restarts at step 1 —
                            and so its project/schedule lookups only run once the
                            dialog is actually on screen */}
                        {open && <AddNewMemberModal onClose={() => setOpen(false)}></AddNewMemberModal>}
                    </form>
                </Dialog>
            </div>
            <div className=" flex items-center justify-end md:justify-between">
                <SearchBar onSearch={handleSearch} />
            </div>
        </div>
    );
};

export default MemberHeroSection;
