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
                    'text-sm px-2 py-2 rounded-lg cursor-pointer flex gap-1.5 items-center ',
                    active
                        ? 'bg-white border border-borderColor text-primary font-medium'
                        : 'text-gray-600 hover:text-primary',
                    isCollapsed && '!px-2'
                )}
            >
                {active && !isCollapsed && <GitCommitVertical size={18} />}
                <span >{label}</span>
            </div>
        </Link>
    );
};

export default SubItem;
