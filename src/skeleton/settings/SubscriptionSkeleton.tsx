
const SubscriptionSkeleton = () => {
    const CheckCircle2Skeleton = () => (
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded-full flex-shrink-0 animate-pulse"></div>
    );
    const PlanCardSkeleton = ({ index }: { index: number }) => (

        <div
            key={index}
            className="flex flex-col justify-between border rounded-lg shadow overflow-hidden h-full mt-5 dark:border-darkBorder"
        >
            {/* Top Section (Price, Button) */}
            <div className="px-6 pt-6">
                {/* Title */}
                <div className="h-7 w-2/12 bg-gray-300 dark:bg-gray-700 rounded mb-5 animate-pulse"></div>

                {/* Price/Period */}
                <div className="flex gap-2 items-end mb-5">
                    <div className="h-10 w-1/8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-6/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Button */}
                <div className="w-full py-2 border rounded-md h-10 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
            </div>

            {/* Features List Section */}
            <ul className="mt-6 space-y-3 m-6 pt-6 border-t-2 border-gray-100 dark:border-darkBorder">
                {Array.from({ length: 7 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-2 mb-6">
                        <CheckCircle2Skeleton />
                        <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </li>
                ))}
            </ul>
        </div>
    );
    return (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 my-5">
                {Array.from({ length: 3 }).map((_, index) => (
                    <PlanCardSkeleton key={index} index={index} />
                ))}
            </div>
    );
};

export default SubscriptionSkeleton;