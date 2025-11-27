import { Circle } from "lucide-react";

const AllScreenShortsSkeleton = () => {

    const SKELETON_COUNT = 6;
    const skeletonItems = Array.from({ length: SKELETON_COUNT }, (_, index) => index);
    const timeBlocks = Array.from({ length: 2 }, (_, index) => index);

    return (
        <>
            {timeBlocks.map((blockIndex) => (
                <div key={blockIndex} className={`${blockIndex > 0 ? 'mt-5' : ''}`}>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Circle size={20} className="text-gray-300 dark:text-gray-700" />
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>

                        <h2 className="text-lg text-subTextColor dark:text-darkTextSecondary flex items-center gap-1.5">
                            Total time worked: <span className="font-medium h-4 w-16 inline-block bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        </h2>
                    </div>

                    <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {skeletonItems.map((index) => (
                            <div key={index} className="p-3 rounded-lg border border-borderColor dark:border-darkBorder">
                                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-3"></div>

                                <div className="mt-3">
                                    <div className="flex justify-between items-center">
                                        {/* Start Time Placeholder */}
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </div>
                                    {/* Project Title Placeholder */}
                                    <div className="mt-1 h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded font-medium animate-pulse"></div>
                                    {/* Task Name Placeholder */}
                                    <div className="mt-1 h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
};

export default AllScreenShortsSkeleton;