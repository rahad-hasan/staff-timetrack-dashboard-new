
const loading = () => {
    const NUMBER_OF_SKELETON_ROWS = 3;
    const skeletonRows = Array.from({ length: NUMBER_OF_SKELETON_ROWS });
    // <div className=" border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px] w-full animate-pulse">
    //     <div className=" rounded-[12px] w-full animate-pulse mb-3">
    //         <div className="flex justify-between">
    //             <div className="h-5 w-32 sm:w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
    //             <div className="flex items-center gap-3">
    //                 <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700"></div>
    //                 <div className="h-8 w-24 rounded-md bg-gray-200 dark:bg-gray-700"></div>
    //             </div>
    //         </div>
    //     </div>

    //     <div className="flex justify-between items-center">
    //         <div className="flex items-center gap-3">
    //             <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    //             <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
    //         </div>
    //         <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
    //     </div>
    //     <div className=" overflow-x-scroll sm:overflow-auto">
    //         <div className="flex justify-between gap-2.5 mt-5 min-w-[500px]">
    //             {[...Array(3)].map((_, index) => (
    //                 <div
    //                     key={index}
    //                     className="relative w-1/3 h-26 sm:h-30 2xl:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
    //                 >
    //                     <div className="absolute top-2 right-2 h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
    //                 </div>
    //             ))}
    //         </div>
    //     </div>

    //     <div className="flex justify-between items-center mt-5">
    //         <div className="flex items-center gap-3">
    //             <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    //             <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
    //         </div>
    //         <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
    //     </div>

    //     <div className=" overflow-x-scroll sm:overflow-auto">
    //         <div className="flex justify-between gap-2.5 mt-5 min-w-[500px]">
    //             {[...Array(3)].map((_, index) => (
    //                 <div
    //                     key={index}
    //                     className="relative w-1/3 h-26 sm:h-30 2xl:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
    //                 >
    //                     <div className="absolute top-2 right-2 h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
    //                 </div>
    //             ))}
    //         </div>
    //     </div>
    //     <div className="flex justify-between items-center mt-5">
    //         <div className="flex items-center gap-3">
    //             <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    //             <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
    //         </div>
    //         <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
    //     </div>

    //     <div className=" overflow-x-scroll sm:overflow-auto">
    //         <div className="flex justify-between gap-2.5 mt-5 min-w-[500px]">
    //             {[...Array(3)].map((_, index) => (
    //                 <div
    //                     key={index}
    //                     className="relative w-1/3 h-26 sm:h-30 2xl:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
    //                 >
    //                     <div className="absolute top-2 right-2 h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
    //                 </div>
    //             ))}
    //         </div>
    //     </div>
    // </div>


    return (
        <div className="w-full border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px] h-full animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-3 sm:w-1/2">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-9 w-[170px] sm:w-[200px] bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>

            <div className="mt-5 pb-1">
                <div className="flex border-b border-borderColor dark:border-darkBorder py-3 mb-2">
                    <div className=" h-4 bg-gray-100 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                    <div className=" h-4 bg-gray-100 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                </div>

                <div className="space-y-1">
                    {skeletonRows.map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-4 border-b border-borderColor dark:border-darkBorder/30 last:border-0"
                        >
                            <div className="flex items-center gap-3 w-1/3 min-w-[160px]">
                                <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 "></div>
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="w-1/3 flex justify-center">
                                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="w-1/3 flex justify-end">
                                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default loading;