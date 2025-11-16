const TeamsMemberTableSkeleton = () => {
    const NUMBER_OF_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_ROWS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} ${isRounded ? 'rounded-full' : 'rounded-md'}`}></div>
    );

    const MIN_TABLE_WIDTH = 'min-w-[1200px]';

    return (
        <div className="border-2 border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg rounded-lg p-5 animate-pulse max-w-full">
            
            <div className="mb-5">
                <PlaceholderBlock className="h-6 w-24" /> 
            </div>

            <div className="w-full overflow-x-auto">
                <div className={`w-full ${MIN_TABLE_WIDTH}`}>

                    <div className="flex border-b border-gray-200 dark:border-darkBorder py-3 text-sm font-semibold text-gray-500 px-1">
                        <div className="w-[3%] flex items-center pr-2">
                             <PlaceholderBlock className="h-5 w-5 bg-gray-300 rounded-sm" /> 
                        </div>
                        <div className="w-[20%]">Member name</div>
                        <div className="w-[10%]">Status</div>
                        <div className="w-[10%]">Role</div>
                        <div className="w-[10%] text-center">Project</div>
                        <div className="w-[14%] text-center">Limit</div>
                        <div className="w-[13%] ">Member since</div>
                        <div className="w-[10%] text-center">Time Tracking</div>
                        <div className="w-[8%] flex justify-end">Action</div>
                    </div>

                    <div className="space-y-0">
                        {skeletonRows.map((_, index) => (
                            <div key={index} className="flex items-center border-b border-gray-100 dark:border-darkBorder py-3 last:border-b-0 px-1">

                                <div className="w-[3%] flex items-center pr-2">
                                    <PlaceholderBlock className="h-5 w-5 bg-gray-300 rounded-sm" />
                                </div>

                                <div className="w-[20%] flex items-center gap-2">
                                    <PlaceholderBlock className="w-8 h-8 rounded-full" />
                                    <PlaceholderBlock className="h-4 w-3/5" /> 
                                </div>

                                <div className="w-[10%] flex justify-start">
                                    <PlaceholderBlock className="h-6 w-16 rounded-full" />
                                </div>

                                <div className="w-[10%] flex justify-start">
                                    <PlaceholderBlock className="h-4 w-4/4" />
                                </div>

                                <div className="w-[10%] flex justify-center">
                                    <PlaceholderBlock className="h-4 w-4" />
                                </div>

                                <div className="w-[14%] flex items-center flex-col gap-1">
                                    <PlaceholderBlock className="h-3 w-3/5" />
                                    <PlaceholderBlock className="h-3 w-3/5" />
                                </div>

                                <div className="w-[13%] flex ">
                                    <PlaceholderBlock className="h-4 w-20" />
                                </div>

                                <div className="w-[10%] flex justify-center">
                                    <PlaceholderBlock className="h-6 w-16 rounded-full" />
                                </div>

                                <div className="w-[8%] flex justify-end">
                                    <PlaceholderBlock className="h-6 w-6 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamsMemberTableSkeleton;