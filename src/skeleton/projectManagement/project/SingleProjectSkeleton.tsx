const SingleProjectSkeleton = () => {
  return (
    <div className="animate-pulse w-full">
      {/* 1. Header Section (Breadcrumb & Buttons) */}
      <div className="flex justify-between items-center">
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-darkSecondaryBg rounded" />
          <div className="h-5 w-24 bg-gray-200 dark:bg-darkSecondaryBg rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-gray-200 dark:bg-darkSecondaryBg rounded-xl" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-darkSecondaryBg rounded-xl" />
        </div>
      </div>

      <div className="mt-4 xl:w-[80%] 2xl:w-[70%]">
        {/* 2. Title and Description */}
        <div className="space-y-3">
          <div className="h-7 w-[40%] bg-gray-300 dark:bg-darkSecondaryBg rounded" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-darkSecondaryBg rounded" />
            <div className="h-4 w-[80%] bg-gray-200 dark:bg-darkSecondaryBg rounded" />
          </div>
        </div>

        {/* 3. Horizontal Info Table Skeleton */}
        <div className="mt-6 w-full overflow-x-auto">
          <div className="min-w-[600px] w-full">
            {/* Table Header Row */}
            <div className="flex justify-between mb-4 px-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 w-20 bg-gray-200 dark:bg-darkSecondaryBg rounded" />
              ))}
            </div>
            {/* Table Body Row */}
            <div className="flex justify-between px-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-5 w-24 bg-gray-300 dark:bg-darkSecondaryBg rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* 4. Manager & Duration Cards (Grid) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl overflow-hidden">
              <div className="h-[90px] 2xl:h-[105px] bg-[#f6f7f9] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center gap-3 px-4">
                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                <div className="h-5 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-[40px] 2xl:h-[45px] flex items-center px-4">
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
          {/* Duration Card */}
          <div className="h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl overflow-hidden">
            <div className="h-[90px] 2xl:h-[105px] bg-[#f6f7f9] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center px-4">
              <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-[40px] 2xl:h-[45px] flex items-center px-4">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Tabs and Large Table Section */}
      <div className="mt-10">
        <div className="h-10 w-[220px] bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg" />
        
        <div className="mt-5 border border-borderColor dark:border-darkBorder p-5 rounded-[12px]">
            <div className="h-6 w-48 bg-gray-200 dark:bg-darkSecondaryBg rounded mb-8" />
            <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-full bg-gray-100 dark:bg-darkSecondaryBg rounded" />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProjectSkeleton;