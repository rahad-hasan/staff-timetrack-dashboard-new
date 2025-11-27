
const TeamsTableSkeleton = () => {
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
                    className={`w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 border border-white dark:border-darkBorder`}
                    style={{ marginLeft: index > 0 ? '-12px' : '0' }}
                ></div>
            ))}

            <div
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border border-white dark:border-darkBorder flex items-center justify-center text-xs text-gray-400 font-medium"
                style={{ marginLeft: '-12px' }}
            >
                10+
            </div>
        </div>
    );

    const MIN_TABLE_WIDTH = 'min-w-[1000px]';

    return (
        <div className="mt-5 border p-3 border-borderColor dark:border-darkBorder rounded-[12px] animate-pulse max-w-full">
            <div className="mb-5">
                <PlaceholderBlock className="h-6 w-20" />
            </div>

            <div className="w-full overflow-x-auto">
                <div className={`w-full ${MIN_TABLE_WIDTH}`}>
                    <div className="flex border-b border-gray-200 dark:border-darkBorder py-3 text-sm font-medium text-gray-500">

                        <div className="w-[33%] pl-2">Team Name</div>
                        <div className="w-[25%]">Members</div>
                        <div className="w-[24%]">Project</div>
                        <div className="w-[17%] flex justify-center">Action</div>
                    </div>

                    <div className="space-y-2">
                        {skeletonRows.map((_, index) => (
                            <div key={index} className="flex items-center border-b border-gray-100 dark:border-gray-800 py-3 last:border-b-0">


                                <div className="w-[33%] flex flex-col gap-1 pl-2">
                                    <PlaceholderBlock className="h-4 w-6/12" />
                                </div>

                                <div className="w-[25%]">
                                    <AssigneeGroupSkeleton />
                                </div>

                                <div className="w-[24%]">
                                    <PlaceholderBlock className="h-4 w-24" />
                                </div>

                                <div className="w-[17%] flex justify-center">
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

export default TeamsTableSkeleton;