
const ProjectTableSkeleton = () => {
    const NUMBER_OF_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_ROWS });

    const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${className} ${isRounded ? 'rounded-full' : 'rounded'}`}></div>
    );

    const AssigneeGroupSkeleton = () => (
        <div className="flex items-center">

            {[...Array(3)].map((_, index) => (
                <div
                    key={index}
                    className={`w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white`}
                    style={{ marginLeft: index > 0 ? '-12px' : '0' }} 
                ></div>
            ))}

            <div 
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white flex items-center justify-center text-xs text-gray-400 font-semibold"
                style={{ marginLeft: '-12px' }}
            >
                10+
            </div>
        </div>
    );

    const MIN_TABLE_WIDTH = 'min-w-[1000px]'; 

    return (
        <div className="mt-5 border-2 p-3 border-borderColor rounded-[12px] animate-pulse max-w-full">
            <div className="mb-5">
                <PlaceholderBlock className="h-6 w-20" /> 
            </div>

            <div className="w-full overflow-x-auto">
                <div className={`w-full ${MIN_TABLE_WIDTH}`}>
                    <div className="flex border-b border-gray-200 py-3 text-sm font-semibold text-gray-500">
                        <div className="w-[4%] flex justify-start">
                            <PlaceholderBlock className="h-5 w-5 bg-gray-300" />
                        </div>
                        <div className="w-[30%] pl-2">Project Name</div>
                        <div className="w-[16%]">Manager</div>
                        <div className="w-[15%]">Assignee</div>
                        <div className="w-[10%]">Time Worked</div>
                        <div className="w-[10%]">Deadline</div>
                        <div className="w-[11%] flex justify-end">Status</div>
                        <div className="w-[4%] flex justify-end">Action</div>
                    </div>

                    <div className="space-y-2">
                        {skeletonRows.map((_, index) => (
                            <div key={index} className="flex items-center border-b border-gray-100 dark:border-gray-800 py-3 last:border-b-0">
                                <div className="w-[4%] flex justify-start">
                                    <PlaceholderBlock className="h-5 w-5 bg-gray-300" />
                                </div>

                                <div className="w-[30%] flex flex-col gap-1 pl-2">
                                    <PlaceholderBlock className="h-4 w-11/12" />
                                    <PlaceholderBlock className="h-3 w-8/12 bg-gray-300" />
                                </div>

                                <div className="w-[16%] flex items-center gap-2">
                                    <PlaceholderBlock className="w-10 h-10 rounded-full bg-gray-300" />
                                    <PlaceholderBlock className="h-4 w-20" />
                                </div>

                                <div className="w-[15%]">
                                    <AssigneeGroupSkeleton />
                                </div>

                                <div className="w-[10%]">
                                    <PlaceholderBlock className="h-4 w-16" />
                                </div>

                                <div className="w-[10%]">
                                    <PlaceholderBlock className="h-4 w-16" />
                                </div>

                                <div className="w-[11%] flex justify-center">
                                    <PlaceholderBlock className="h-8 w-24 rounded-full" />
                                </div>

                                <div className="w-[4%] flex justify-end">
                                    <PlaceholderBlock className="h-8 w-8 bg-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTableSkeleton;