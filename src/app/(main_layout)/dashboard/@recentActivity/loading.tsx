
const loading = () => {

    return (
        <div className=" border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px] w-full animate-pulse">
            <div className=" rounded-[12px] w-full animate-pulse mb-3">
                <div className="flex justify-between">
                    <div className="h-5 w-32 sm:w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-8 w-24 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className=" overflow-x-scroll sm:overflow-auto">
                <div className="flex justify-between gap-2.5 mt-5 min-w-[500px]">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={index}
                            className="relative w-1/3 h-26 sm:h-30 2xl:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
                        >
                            <div className="absolute top-2 right-2 h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center mt-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <div className=" overflow-x-scroll sm:overflow-auto">
                <div className="flex justify-between gap-2.5 mt-5 min-w-[500px]">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={index}
                            className="relative w-1/3 h-26 sm:h-30 2xl:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
                        >
                            <div className="absolute top-2 right-2 h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-between items-center mt-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <div className=" overflow-x-scroll sm:overflow-auto">
                <div className="flex justify-between gap-2.5 mt-5 min-w-[500px]">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={index}
                            className="relative w-1/3 h-26 sm:h-30 2xl:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
                        >
                            <div className="absolute top-2 right-2 h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default loading;