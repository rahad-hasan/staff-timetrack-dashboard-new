import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EventGoogleSyncOverview } from "@/types/type";
import { SyncStatusPill } from "../eventHelpers";
import { ExternalLink } from "lucide-react";

const GoogleSyncMemberRow = ({
    member,
}: {
    member: EventGoogleSyncOverview["members"][number];
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
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            )}
        </div>
    </div>
);

export default GoogleSyncMemberRow;