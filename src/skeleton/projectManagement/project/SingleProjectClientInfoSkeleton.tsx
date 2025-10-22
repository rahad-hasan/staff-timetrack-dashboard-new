

const PlaceholderBlock = ({ className = "h-4 w-full", isRounded = false }) => (
    <div className={`bg-gray-200  ${className} ${isRounded ? 'rounded-full' : 'rounded-lg'}`}></div>
);

const SingleProjectClientInfoSkeleton = () => {

    // Helper component for the table row
    const TableRowSkeleton = () => (
        <tr className="border-t border-gray-200">
            <td className="py-3 px-3">
                <PlaceholderBlock className="h-4 w-32" />
            </td>
            <td className="py-3 px-3">
                <PlaceholderBlock className="h-4 w-40" />
            </td>
            <td className="py-3 px-3">
                <PlaceholderBlock className="h-4 w-28" />
            </td>
            <td className="py-3 px-3">
                <PlaceholderBlock className="h-4 w-28" />
            </td>
            <td className="py-3 px-3">
                <PlaceholderBlock className="h-4 w-24" />
            </td>
        </tr>
    );

    // Array to map through for the four statistic cards
    const cardColors = ['bg-[#fff5db]', 'bg-[#eff7fe]', 'bg-[#ede7ff]', 'bg-[#fee6eb]'];

    return (

        <div className="mt-4 xl:w-[80%] 2xl:w-[70%] animate-pulse">
            <div className="mx-auto">
                <div className="mt-8 w-full overflow-x-auto ">
                    <table className="min-w-[700px] w-full border-collapse text-sm md:text-base">
                        <thead className=" dark:bg-gray-800">
                            <tr>
                                <th className="text-left py-2 px-3 whitespace-nowrap text-sm font-semibold text-gray-500">Client</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap text-sm font-semibold text-gray-500">Phone</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap text-sm font-semibold text-gray-500">Starting Date</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap text-sm font-semibold text-gray-500">Deadline</th>
                                <th className="text-left py-2 px-3 whitespace-nowrap text-sm font-semibold text-gray-500">Project Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            <TableRowSkeleton />
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-6">
                    {cardColors.map((bgColor, index) => (
                        <div key={index} className="border border-borderColor rounded-xl w-full">
                            <div className={`py-10 ${bgColor} text-3xl font-semibold text-center border-b border-borderColor rounded-t-xl`}>
                                <PlaceholderBlock className="h-9 w-2/3 mx-auto" />
                            </div>
                            <div className="text-center py-4">
                                <PlaceholderBlock className="h-4 w-1/2 mx-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SingleProjectClientInfoSkeleton;
