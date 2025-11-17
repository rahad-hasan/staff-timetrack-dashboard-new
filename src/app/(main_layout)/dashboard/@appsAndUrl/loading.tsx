import { EllipsisVertical } from 'lucide-react';

const loading = () => {

    const NUMBER_OF_SKELETON_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_SKELETON_ROWS });

    return (
        <div className="border border-borderColor bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px] w-full animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gray-200 border-none">
                        <EllipsisVertical className="text-gray-200" />
                    </div>
                    <div className="h-8 w-24 rounded-md bg-gray-200"></div>
                </div>
            </div>
            <div className=" overflow-x-scroll sm:overflow-auto">
                <div className="flex border-b border-gray-200 py-3 text-sm font-semibold text-gray-500 mt-5">
                    <div className="w-[30%] pl-2 min-w-[200px]">App or Site</div>
                    <div className="w-[30%] text-center min-w-[100px]">Today</div>
                    <div className="w-[40%] text-center min-w-[100px]">This Week</div>
                </div>
                <div className="mt-5 space-y-4">
                    {skeletonRows.map((_, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center gap-3 w-2/5 min-w-[200px]">
                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                <div className="flex flex-col gap-1">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                </div>
                            </div>

                            <div className="flex flex-col items-start w-1/5 min-w-[100px]">
                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            </div>

                            <div className="flex justify-end items-center gap-3 w-2/5">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default loading;