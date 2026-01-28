
const AllScreenShortsSkeleton = () => {

    const SKELETON_COUNT = 6;
    const skeletonItems = Array.from({ length: SKELETON_COUNT }, (_, index) => index);
    const timeBlocks = Array.from({ length: 2 }, (_, index) => index);

    return (
        <>
            {timeBlocks.map((blockIndex) => (
                <div key={blockIndex} className={`${blockIndex > 0 ? 'mt-5' : ''}`}>

                    <div className="mb-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {skeletonItems.map((index) => (
                            <div key={index}>
                                <div className="mb-3 flex flex-col items-center">
                                    <div className="mt-1 h-5 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                    <div className="mt-2 h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                </div>
                                <div className=" rounded-lg border border-borderColor dark:border-darkBorder">
                                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse mb-3"></div>

                                    <div className=" px-3 mb-3">
                                        <div className="mt-1 h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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

export default AllScreenShortsSkeleton;