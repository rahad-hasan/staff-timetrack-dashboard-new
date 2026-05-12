import { EventGoogleSyncOverview } from "@/types/type";
import Image from "next/image";
import { SyncStatusPill } from "../eventHelpers";
import GoogleSyncMemberRow from "./GoogleSyncMemberRow";
import { ArrowRight, Users } from "lucide-react";
import googleMeetIcon from "../../../assets/events/google_meet.svg";

const GoogleSyncCard = ({
    overview,
    limit,
    onViewAll,
}: {
    overview: EventGoogleSyncOverview;
    limit?: number;
    onViewAll?: () => void;
}) => {
    if (!overview?.enabled) return null;

    const { counts } = overview;
    const total = counts?.total_assigned ?? 0;
    const synced = counts?.synced ?? 0;
    const members = overview.members ?? [];
    const visibleMembers =
        typeof limit === "number" ? members.slice(0, limit) : members;
    const hiddenCount = members.length - visibleMembers.length;

    const progress = total > 0 ? Math.min(100, Math.round((synced / total) * 100)) : 0;

    return (
        <div className="overflow-hidden rounded-lg border border-borderColor bg-white dark:border-darkBorder dark:bg-darkPrimaryBg">
            <div className="border-b border-borderColor bg-bgSecondary/45 px-4 py-3 dark:border-darkBorder dark:bg-darkSecondaryBg/60">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-darkPrimaryBg">
                            <Image src={googleMeetIcon} width={50} height={50} className="w-5" alt="" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                Synced via Google Calendar
                            </p>
                            <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {synced}
                                </span>{" "}
                                of {total} invite{total === 1 ? "" : "s"} delivered
                            </p>
                        </div>
                    </div>
                    {overview.organizer && (
                        <SyncStatusPill status={overview.organizer.status} />
                    )}
                </div>
                {total > 0 && (
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-borderColor/60 dark:bg-darkBorder/60">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {visibleMembers.length > 0 && (
                <div className="divide-y divide-borderColor dark:divide-darkBorder">
                    {visibleMembers.map((member) => (
                        <GoogleSyncMemberRow key={member.user_id} member={member} />
                    ))}
                </div>
            )}

            {hiddenCount > 0 && onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="group flex w-full items-center justify-between gap-3 border-t border-borderColor bg-bgSecondary/30 px-4 py-3 text-xs font-semibold text-primary transition hover:bg-primary/5 dark:border-darkBorder dark:bg-darkSecondaryBg/40"
                >
                    <span className="inline-flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        View all {members.length} attendees
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
            )}
        </div>
    );
};

export default GoogleSyncCard;