import { EllipsisVertical } from 'lucide-react';

const loading = () => {

    const NUMBER_OF_SKELETON_ROWS = 4;
    const skeletonRows = Array.from({ length: NUMBER_OF_SKELETON_ROWS });

    return (
        <div className="border-2 border-borderColor p-3 rounded-[12px] w-full animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gray-200 border-none">
                        <EllipsisVertical className="text-gray-200" />
                    </div>
                    <div className="h-8 w-24 rounded-md bg-gray-300"></div>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                {skeletonRows.map((_, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3 w-2/5">
                            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                            <div className="flex flex-col gap-1">
                                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                                <div className="h-3 w-56 bg-gray-200 rounded"></div>
                                <div className="h-3 w-32 bg-gray-100 rounded"></div>
                            </div>
                        </div>

                        <div className="flex flex-col items-start w-1/5">
                            <div className="h-4 w-10 mb-1 bg-gray-300 rounded-full"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>

                        <div className="flex justify-end items-center gap-3 w-2/5">
                            <div className="flex flex-col items-end gap-1">
                                <div className="h-4 w-12 mb-1 bg-gray-300 rounded-full"></div>
                                <div className="flex flex-col items-end">
                                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-24 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                            <div className="h-10 w-10 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default loading;