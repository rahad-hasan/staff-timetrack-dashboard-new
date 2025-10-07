import clsx from 'clsx';
import { GitCommitVertical } from 'lucide-react';

const SubItem = ({
    label,
    active = false,
    isCollapsed,
    onClick
}: {
    label: string;
    active?: boolean;
    isCollapsed: boolean;
    onClick?: () => void;
}) => {

    return (
        <div
            onClick={onClick}
            className={clsx(
                'text-sm px-2 py-2 rounded-lg  cursor-pointer flex gap-1.5 items-center ',
                active ? 'bg-white border border-borderColor text-primary font-medium' : 'text-gray-600 hover:text-primary px-8' ,isCollapsed &&' !px-2'
            )}
        >
            {(active && !isCollapsed) && <GitCommitVertical size={18} />} {label}
        </div>
    );
}

export default SubItem;