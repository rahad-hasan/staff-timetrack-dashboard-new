"use client"
import { SheetClose } from '@/components/ui/sheet';
import clsx from 'clsx';
import { GitCommitVertical } from 'lucide-react';
import Link from 'next/link';

const MobileSubItem = ({
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
            <SheetClose asChild>
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
            </SheetClose>
        </Link>
    );
};

export default MobileSubItem;
