
const AppNameTableSkeleton = () => {
    return (
        <div className="py-4 rounded-xl  border-2 border-borderColor">
            <div className="space-y-2  w-full overflow-x-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center w-full p-3  border-b border-gray-100 bg-white">
                        <div className="bg-gray-200 rounded-md animate-pulse h-6 min-w-[200px] md:w-2/12" />
                        <div className="flex items-center justify-center min-w-[180px] md:w-3/12">
                            <div className="bg-gray-200 rounded-md animate-pulse h-6 w-28" />
                        </div>
                        <div className="flex items-center justify-center min-w-[180px] md:w-3/12">
                            <div className="bg-gray-200 rounded-md animate-pulse h-6 w-12" />
                        </div>
                        <div className="bg-gray-200 rounded-md animate-pulse h-6 min-w-[180px] md:w-2/12" />
                        <div className=" flex items-center justify-end min-w-[180px] md:w-2/12">
                            <div className="bg-gray-200 rounded-md animate-pulse h-8 w-22 " />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppNameTableSkeleton;