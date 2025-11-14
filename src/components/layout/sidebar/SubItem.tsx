"use client"
import clsx from 'clsx';
import { GitCommitVertical } from 'lucide-react';
import Link from 'next/link';

const SubItem = ({
    label,
    href,
    active = false,
    isCollapsed,
    onClick,
}: {
    label: string;
    href?: string;
    active?: boolean;
    isCollapsed?: boolean;
    onClick?: () => void;
}) => {
    return (
        <Link href={href ?? '#'} passHref>
            <div
                onClick={onClick}
                className={clsx(
                    'text-base px-2 py-2 rounded-lg cursor-pointer flex gap-1.5 items-center text-headingTextColor dark:text-darkTextPrimary ',
                    active
                        ? 'bg-white border border-borderColor dark:border-none dark:text-primary dark:bg-darkPrimaryBg text-primary font-medium'
                        : 'text-subTextColor hover:text-primary',
                    isCollapsed && '!px-2 '
                )}
            >
                {active && !isCollapsed && <GitCommitVertical size={18} />}
                <span >{label}</span>
            </div>
        </Link>
    );
};

export default SubItem;
