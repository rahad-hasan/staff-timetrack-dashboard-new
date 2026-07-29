import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EventMemberSyncOverview } from "@/types/type";
import { SyncStatusPill } from "../eventHelpers";
import { ExternalLink } from "lucide-react";

const AttendeeRow = ({
    member,
    organizerId,
}: {
    member: EventMemberSyncOverview;
    organizerId?: number | null;
}) => {
    const isOrganizer = member.is_organizer || member.user_id === organizerId;

    return (
        <div className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bgSecondary/40 dark:hover:bg-darkSecondaryBg/50">
            <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0 ring-1 ring-borderColor/70 dark:ring-darkBorder">
                    <AvatarImage src={member.image || ""} />
                    <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                        {member.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                            {member.name}
                        </p>
                        {isOrganizer && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                                Organizer
                            </span>
                        )}
                    </div>
                    <p className="truncate text-xs text-subTextColor dark:text-darkTextSecondary">
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-borderColor text-subTextColor opacity-0 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary group-hover:opacity-100 dark:border-darkBorder dark:text-darkTextSecondary"
                        title="Open in Google Calendar"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                )}
            </div>
        </div>
    );
};

export default AttendeeRow;