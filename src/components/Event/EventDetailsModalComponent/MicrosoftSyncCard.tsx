import { EventMemberSyncOverview, EventMicrosoftSyncOverview } from "@/types/type";
import Image from "next/image";
import { SyncStatusPill } from "../eventHelpers";
import { ExternalLink } from "lucide-react";
import microsoftTeamsIcon from "../../../assets/events/microsoft-teams.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const MicrosoftSyncMemberRow = ({
    member,
}: {
    member: EventMemberSyncOverview;
}) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bgSecondary/35 dark:hover:bg-darkSecondaryBg/40">
        <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={member.image || ""} />
                <AvatarFallback className="text-[10px]">
                    {member.name?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {member.name}
                    </p>
                    {member.is_organizer && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                            Organizer
                        </span>
                    )}
                </div>
                <p className="truncate text-[11px] text-subTextColor dark:text-darkTextSecondary">
                    {member.email}
                </p>
            </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
            {member.last_error ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <SyncStatusPill status={member.status} />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs dark:border-darkBorder dark:bg-darkPrimaryBg">
                            <p className="text-xs">{member.last_error}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <SyncStatusPill status={member.status} />
            )}

            {member.calendar_link && (
                <a
                    href={member.calendar_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-borderColor text-primary transition hover:bg-primary/5 dark:border-darkBorder"
                    title="Open in Outlook"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            )}
        </div>
    </div>
);



const MicrosoftSyncCard = ({
    overview,
}: {
    overview: EventMicrosoftSyncOverview;
}) => {
    if (!overview?.enabled) return null;

    const counts = overview.counts;
    const total = counts?.total_assigned ?? overview.members?.length ?? 0;
    const synced = counts?.synced ?? 0;
    const members = overview.members ?? [];
    const progress =
        total > 0 ? Math.min(100, Math.round((synced / total) * 100)) : 0;

    return (
        <div className="overflow-hidden rounded-lg border border-borderColor bg-white dark:border-darkBorder dark:bg-darkPrimaryBg">
            <div className="border-b border-borderColor bg-bgSecondary/45 px-4 py-3 dark:border-darkBorder dark:bg-darkSecondaryBg/60">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-darkPrimaryBg">
                            <Image src={microsoftTeamsIcon} width={50} height={50} className="w-5" alt="" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                Synced via Microsoft Teams
                            </p>
                            {total > 0 ? (
                                <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {synced}
                                    </span>{" "}
                                    of {total} invite{total === 1 ? "" : "s"} delivered
                                </p>
                            ) : (
                                <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                    Per-user Teams calendar sync
                                </p>
                            )}
                        </div>
                    </div>
                    <SyncStatusPill status={overview.status} />
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

            {members.length > 0 && (
                <div className="divide-y divide-borderColor dark:divide-darkBorder">
                    {members.map((member) => (
                        <MicrosoftSyncMemberRow
                            key={`ms-${member.user_id}`}
                            member={member}
                        />
                    ))}
                </div>
            )}

            {overview.last_error && (
                <p className="border-t border-borderColor px-4 py-3 text-[11px] text-red-600 dark:border-darkBorder dark:text-red-400">
                    {overview.last_error}
                </p>
            )}

            {overview.calendar_link && members.length === 0 && (
                <div className="border-t border-borderColor px-4 py-3 dark:border-darkBorder">
                    <a
                        href={overview.calendar_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        Open in Outlook <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            )}
        </div>
    );
};

export default MicrosoftSyncCard;