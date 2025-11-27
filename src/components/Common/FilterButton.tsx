import { EllipsisVertical } from 'lucide-react';
import React from 'react';

const FilterButton = () => {
    return (
        <button className="text-sm md:text-base px-2 py-2 rounded-[8px] border border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary cursor-pointer" ><EllipsisVertical size={18} /></button>
    );
};

export default FilterButton;