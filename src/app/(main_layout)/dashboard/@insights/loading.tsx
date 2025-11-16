
const loading = () => {

    return (
        <div className="border-2 border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px] w-full animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-8 w-28 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center mt-5 border-gray-200 dark:border-gray-800 pb-2">
                <div className="flex items-center gap-3 w-1/2">
                    <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="flex items-center gap-3 w-1/2">
                    <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 border-b-2 border-gray-200 dark:border-gray-700 pb-5">

                <div className="mt-5  sm:w-1/2">
                    <div className="flex justify-between">
                        <div className="mb-4">
                            <div className="h-7 w-12 rounded bg-gray-200 dark:bg-gray-600 mb-1"></div>
                            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                        </div>

                        <div className="space-y-3">
                            {['Productive', 'Offline', 'Dull'].map((label) => (
                                <div key={label} className="flex items-center text-sm gap-3">
                                    <div className={`w-3 h-3 rounded bg-gray-200 dark:bg-gray-700`}></div>
                                    <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex w-full h-8 rounded-md overflow-hidden mt-16">
                        <div className={`w-[9%] h-full bg-gray-200 dark:bg-gray-700`}></div>
                        <div className={`w-[79%] h-full bg-gray-200 dark:bg-gray-700`}></div>
                        <div className={`w-[12%] h-full bg-gray-200 dark:bg-gray-700`}></div>
                    </div>

                    <div className="flex justify-between mt-2 px-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-3 w-6 rounded bg-gray-200 dark:bg-gray-700/50"></div>
                        ))}
                    </div>
                </div>

                <div className=" sm:w-1/2 flex items-center justify-center pt-5 pb-8">
                    <div className="relative h-44 w-44 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="absolute inset-6 rounded-full bg-white dark:bg-darkPrimaryBg shadow-inner"></div>
                    </div>
                </div>
            </div>
            <div className="mt-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div className="h-8 w-36 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                </div>

                <div className="mt-5 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-3 w-1/3">
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                            <div className="h-4 w-1/3 text-center">
                                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700 mx-auto"></div>
                            </div>
                            <div className="h-4 w-1/3 text-right">
                                <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 ml-auto"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default loading;