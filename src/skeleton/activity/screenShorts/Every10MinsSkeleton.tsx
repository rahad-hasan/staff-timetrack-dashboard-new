import { Circle } from "lucide-react";
const ScreenshotActivityCardSkeleton = () => {

    return (
        <div className="rounded-2xl w-full transition-all h-34 2xl:h-40 shadow-sm dark:shadow-slate-100 relative overflow-hidden">
            <div className="border-x-2 border-t-2 border-borderColor/40 dark:border-darkBorder/25 flex items-center justify-between px-3 2xl:px-4 py-[1.4rem] 2xl:py-[2rem] bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                <div className="flex items-center gap-2 2xl:gap-3">
                    <div className="w-9 h-9 2xl:w-10 2xl:h-10 bg-gray-200 dark:bg-darkSecondaryBg rounded-lg animate-pulse" />

                    <div className="space-y-2">
                        <div className="h-6 w-16 2xl:w-20 bg-gray-200 dark:bg-darkSecondaryBg rounded-full animate-pulse" />
                        <div className="h-4 w-12 2xl:w-16 bg-gray-100 dark:bg-darkSecondaryBg/60 rounded-full animate-pulse" />
                    </div>
                </div>

                <div className="w-16 sm:w-18 h-9 xl:w-[55px] xl:h-9 2xl:w-22 2xl:h-12 bg-gray-200 dark:bg-darkSecondaryBg rounded-md animate-pulse" />
            </div>

            <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t border-borderColor/20 dark:border-darkBorder/25 px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                <div className="w-5 h-5 bg-gray-200 dark:bg-darkPrimaryBg rounded-full animate-pulse" />
                <div className="h-4 w-40 bg-gray-100 dark:bg-darkPrimaryBg rounded-full animate-pulse" />
            </div>
        </div>
    );
};

const Every10MinsSkeleton = () => {
    const SKELETON_COUNT = 6;
    const skeletonItems = Array.from({ length: SKELETON_COUNT }, (_, index) => index);
    const timeBlocks = Array.from({ length: 2 }, (_, index) => index);



    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <ScreenshotActivityCardSkeleton />
                <ScreenshotActivityCardSkeleton />
                <ScreenshotActivityCardSkeleton />
                <ScreenshotActivityCardSkeleton />
            </div>
            {timeBlocks.map((blockIndex) => (
                <div key={blockIndex} className="mt-5">
                    <div className="flex gap-2 sm:gap-3 justify-between items-center h-3">
                        <div className="flex items-center gap-2 -ml-[6px]">
                            <Circle
                                size={12}
                                className="rounded-full text-gray-200 dark:text-gray-800 bg-gray-200 dark:bg-darkSecondaryBg"
                            />
                            <div className="h-4 w-32 bg-gray-200 dark:bg-darkSecondaryBg rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-4 w-40 bg-gray-200 dark:bg-darkSecondaryBg rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-6 gap-4 pl-4 py-5 border-l border-gray-100 dark:border-darkBorder">
                        {skeletonItems.map((index) => (
                            <div key={index} className="mb-5">

                                <div className="flex flex-col items-center space-y-2 mb-2">
                                    <div className="h-6 w-full bg-gray-200 dark:bg-darkSecondaryBg rounded-full animate-pulse"></div>
                                    <div className="h-3 w-20 bg-gray-100 dark:bg-darkSecondaryBg rounded animate-pulse"></div>
                                </div>

                                <div className="relative rounded-lg overflow-hidden border border-borderColor dark:border-darkBorder">
                                    <div className="w-full aspect-video bg-gray-200 dark:bg-darkSecondaryBg animate-pulse"></div>
                                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-20 bg-gray-100 dark:bg-darkSecondaryBg rounded-xl shadow-sm border border-white dark:border-gray-600 animate-pulse"></div>

                                    <div className="p-3 space-y-4 pt-5">
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 w-20 bg-gray-200 dark:bg-darkSecondaryBg rounded animate-pulse"></div>
                                            <div className="h-4 w-4 bg-gray-200 dark:bg-darkSecondaryBg rounded animate-pulse"></div>
                                        </div>
                                        <div className="relative h-1.5 w-full bg-gray-100 dark:bg-darkSecondaryBg rounded-full">
                                            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 dark:bg-darkSecondaryBg border-2 border-white dark:border-gray-600 rounded-full"></div>
                                        </div>
                                        <div className="flex justify-center">
                                            <div className="h-3 w-24 bg-gray-200 dark:bg-darkSecondaryBg rounded animate-pulse"></div>
                                        </div>
                                    </div>
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