import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const SectionCard = ({
    title,
    description,
    action,
    children,
    className,
}: {
    title?: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) => (
    <div
        className={cn(
            "rounded-lg border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg",
            className,
        )}
    >
        {(title || description || action) && (
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    {title && (
                        <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            {title}
                        </p>
                    )}
                    {description && (
                        <p className="mt-1 text-xs leading-5 text-subTextColor dark:text-darkTextSecondary">
                            {description}
                        </p>
                    )}
                </div>
                {action}
            </div>
        )}
        {children}
    </div>
);

export default SectionCard;