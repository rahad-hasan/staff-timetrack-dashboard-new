import { Circle } from "lucide-react";

const Every10MinsSkeleton = () => {

    const SKELETON_COUNT = 4;
    const skeletonItems = Array.from({ length: SKELETON_COUNT }, (_, index) => index);
    const timeBlocks = Array.from({ length: 2 }, (_, index) => index);

    return (
        <>
            {timeBlocks.map((blockIndex) => (
                <div key={blockIndex} className={`${blockIndex > 0 ? 'mt-5' : ''}`}>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Circle size={20} className="text-gray-300" />
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        <h2 className="text-lg text-subTextColor">
                            Total time worked: <span className="font-semibold h-4 w-16 inline-block bg-gray-200 rounded animate-pulse"></span>
                        </h2>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {skeletonItems.map((index) => (
                            <div key={index} className="p-3 rounded-lg border border-borderColor bg-white">
                                <div className="w-full h-40 bg-gray-200 rounded-lg animate-pulse mb-3"></div>

                                <div className="mt-3">
                                    <div className="flex justify-between items-center">
                                        {/* Start Time Placeholder */}
                                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    {/* Project Title Placeholder */}
                                    <div className="mt-2 h-5 w-3/6 bg-gray-200 rounded font-semibold animate-pulse"></div>
                                    <div className="my-3 h-3 w-full bg-gray-200 rounded font-semibold animate-pulse"></div>
                                    {/* Task Name Placeholder */}
                                    <div className="mt-1 h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
};

export default Every10MinsSkeleton;