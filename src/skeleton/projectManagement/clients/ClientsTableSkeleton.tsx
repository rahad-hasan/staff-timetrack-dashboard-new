
const ClientsTableSkeleton = () => {
    return (
        <div className="p-2 rounded-xl  border-2 border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg mt-5">
            <div className="space-y-2  w-full overflow-x-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center w-full p-3  border-b border-gray-100 dark:border-darkBorder ">

                        <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 min-w-[200px] md:w-2/12" />
                        <div className="flex items-center justify-end min-w-[150px] md:w-2/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 w-28" />
                        </div>
                        <div className="flex items-center justify-end min-w-[150px] md:w-3/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 w-28" />
                        </div>
                        <div className="flex items-center justify-end min-w-[200px] md:w-4/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-6 min-w-[150px] md:w-[180px] " />
                        </div>
                        <div className=" flex items-center justify-center min-w-[150px] md:w-2/12">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-8 w-8 " />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientsTableSkeleton;