
const WeeklyTimeSheetsSkeleton = () => {
    const NUM_ROWS = 5;

    return (
        <div className="pt-4">
            <div className="overflow-x-auto rounded-2xl border-2 border-borderColor">
                <table className="min-w-full divide-y divide-gray-200">
                    
                    <thead className="bg-gray-50 animate-pulse">
                        <tr className="text-slate-900">
                            <th className="px-4 py-5 text-left border-r border-gray-200 min-w-[200px]">
                                <div className="bg-gray-200 rounded-md h-4 w-24 ml-4" />
                            </th>

                            {Array.from({ length: 7 }).map((_, i) => (
                                <th key={i} className="px-4 py-3 text-center border-r border-gray-200 min-w-[100px]">
                                    <div className="bg-gray-200 rounded-md h-6 w-8 mx-auto mb-1" />
                                    <div className="bg-gray-200 rounded-md h-3 w-8 mx-auto" />
                                </th>
                            ))}
                            
                            <th className="px-4 py-5 text-center min-w-[120px]">
                                <div className="bg-gray-200 rounded-md h-4 w-20 mx-auto" />
                            </th>
                        </tr>
                    </thead>
                    
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: NUM_ROWS }).map((_, rowIndex) => (
                            <tr key={rowIndex} className="animate-pulse">
                                <td className="px-4 py-5 text-left border-r border-gray-100">
                                    <div className="space-y-2">
                                        <div className="bg-gray-200 rounded-md h-5 w-4/5" />
                                        <div className="bg-gray-100 rounded-md h-3 w-2/5" />
                                    </div>
                                </td>

                                {Array.from({ length: 7 }).map((_, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-5 text-center border-r border-gray-100">
                                        <div className="bg-gray-200 rounded-md h-5 w-1/2 mx-auto" />
                                    </td>
                                ))}

                                <td className="px-4 py-5 text-center">
                                    <div className="bg-gray-200 rounded-md h-5 w-3/4 mx-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    <tfoot className="bg-gray-50 border-t border-gray-300">
                        <tr className="text-slate-900 animate-pulse">
                            <td className="px-4 py-5 text-left font-semibold border-r border-gray-200">
                                <div className="bg-gray-200 rounded-md h-5 w-3/4 ml-4" />
                            </td>

                            {Array.from({ length: 7 }).map((_, i) => (
                                <td key={i} className="px-4 py-5 text-center border-r border-gray-200">
                                    <div className="bg-gray-200 rounded-md h-5 w-1/2 mx-auto" />
                                </td>
                            ))}

                            <td className="px-4 py-5 text-center">
                                <div className="bg-gray-200 rounded-md h-6 w-3/4 mx-auto" />
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default WeeklyTimeSheetsSkeleton;
