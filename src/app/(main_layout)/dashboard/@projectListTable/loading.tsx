import React from 'react';
import { EllipsisVertical } from "lucide-react";

const loading = () => {
    const NUMBER_OF_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_ROWS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} ${isRounded ? 'rounded-full' : 'rounded'}`}></div>
    );

    const AssigneeGroupSkeleton = () => (
        <div className="flex items-center min-w-[120px] max-w-full">
            {[...Array(3)].map((_, index) => (
                <div
                    key={index}
                    className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white"
                    style={index > 0 ? { marginLeft: '-12px' } : {}} 
                ></div>
            ))}

            <div 
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white flex items-center justify-center text-xs text-transparent font-semibold"
                style={{ marginLeft: '-12px' }}
            >
                10+
            </div>
        </div>
    );

    return (
        <div className="mt-5 border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px] animate-pulse">
            
            <div className="flex justify-between items-center mb-5">
                <PlaceholderBlock className="h-6 w-36" />
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        <EllipsisVertical className="h-5 w-5" />
                    </div>
                    <PlaceholderBlock className="h-8 w-24" />
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="min-w-max">

                    <div className="flex border-b border-gray-200 dark:border-gray-700 py-3 text-sm font-semibold text-gray-500 min-w-full">

                        <div className="w-[30%] min-w-[200px] pr-4">
                            <PlaceholderBlock className="h-4 w-28" />
                        </div>

                        <div className="w-[20%] min-w-[190px] pr-4">
                            <PlaceholderBlock className="h-4 w-24" />
                        </div>

                        <div className="w-[20%] min-w-[120px] pr-4">
                            <PlaceholderBlock className="h-4 w-20" />
                        </div>

                        <div className="w-[15%] min-w-[120px] pr-4">
                            <PlaceholderBlock className="h-4 w-24" />
                        </div>

                        <div className="w-[15%] min-w-[100px] flex justify-end">
                            <PlaceholderBlock className="h-4 w-16" />
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {skeletonRows.map((_, index) => (
                            <div key={index} className="flex items-center py-4 min-w-full">
                                <div className="w-[30%] min-w-[200px] flex flex-col gap-1 pr-4">
                                    <PlaceholderBlock className="h-4 w-11/12" />
                                    <PlaceholderBlock className="h-3 w-8/12" />
                                </div>
                                <div className="w-[20%] min-w-[190px] flex items-center gap-2 pr-4">
                                    <PlaceholderBlock className="w-10 h-10 rounded-full" />
                                    <PlaceholderBlock className="h-4 w-20" />
                                </div>
                                <div className="w-[20%] min-w-[120px] pr-4">
                                    <AssigneeGroupSkeleton />
                                </div>
                                <div className="w-[15%] min-w-[120px] pr-4">
                                    <PlaceholderBlock className="h-4 w-16" />
                                </div>
                                <div className="w-[15%] min-w-[100px] flex justify-end">
                                    <PlaceholderBlock className="h-8 w-24 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default loading;