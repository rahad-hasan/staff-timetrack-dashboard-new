import React from 'react';

const loading = () => {

    const skeletonRows = 4;

    const PulseBlock = ({ widthClass = 'w-3/4', heightClass = 'h-4', roundedClass = 'rounded-md' }) => (
        <div className={`bg-gray-200 dark:bg-gray-700 ${widthClass} ${heightClass} ${roundedClass}`}></div>
    );

    const SkeletonHeaderCell = ({ widthClass = 'w-24' }) => (
        <th className="px-4 py-3 text-left font-medium text-sm text-gray-500">
            <PulseBlock widthClass={widthClass} heightClass="h-4" roundedClass="rounded-sm" />
        </th>
    );

    const SkeletonRow = ({ isLast }: { isLast: boolean }) => (
        <tr className={`border-b border-gray-100 dark:border-gray-800 ${isLast ? 'border-b-0' : ''}`}>
            <td className="px-4 py-4 w-10">
                <PulseBlock widthClass="w-5" heightClass="h-5" roundedClass="rounded-sm" />
            </td>
            <td className="px-4 py-4 min-w-[200px] max-w-[300px]">
                <div className="flex flex-col space-y-2">
                    <PulseBlock widthClass="w-full" heightClass="h-4" />
                    <PulseBlock widthClass="w-3/5" heightClass="h-4" />
                </div>
            </td>
            <td className="px-4 py-4 w-48">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <PulseBlock widthClass="w-24" heightClass="h-4" />
                </div>
            </td>
            <td className="px-4 py-4 w-32">
                <PulseBlock widthClass="w-20" heightClass="h-4" />
            </td>
            <td className="px-4 py-4 w-32">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <PulseBlock widthClass="w-16" heightClass="h-4" />
                </div>
            </td>
            <td className="px-4 py-4 w-24 text-right">
                <div className="flex justify-end">
                    <div className="w-24 h-7 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="mt-5 border-2 border-gray-200 dark:border-gray-700 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-5 animate-pulse">
                <PulseBlock widthClass="w-36" heightClass="h-6" />

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
            </div>

            <div className="w-full overflow-x-auto animate-pulse">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <SkeletonHeaderCell widthClass="w-5" />
                            <SkeletonHeaderCell widthClass="w-28" />
                            <SkeletonHeaderCell widthClass="w-20" />
                            <SkeletonHeaderCell widthClass="w-24" />
                            <SkeletonHeaderCell widthClass="w-16" />
                            <SkeletonHeaderCell widthClass="w-16 ml-auto" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {Array.from({ length: skeletonRows }).map((_, index) => (
                            <SkeletonRow key={index} isLast={index === skeletonRows - 1} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default loading;