const DashboardHeroSkeleton = () => {

  const skeletonBg = "bg-gray-200 dark:bg-gray-700";
  const skeletonPulse = "animate-pulse";

  return (
    <div className={`mb-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5 ${skeletonPulse}`}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="border border-borderColor dark:border-darkBorder rounded-2xl w-full h-38 relative"
        >
          <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
            <div className='flex items-center gap-3'>
              <div className={`w-10 h-10 border border-borderColor dark:border-darkBorder rounded-lg ${skeletonBg}`}>
                <div className="h-full w-full p-1.5 rounded-lg"></div>
              </div>
              <div>
                <div className={`h-6 w-16 rounded ${skeletonBg} mb-1`}></div>
                <div className={`h-4 w-24 rounded ${skeletonBg}`}></div>
              </div>
            </div>

            <div>
              <div className={`w-18 2xl:w-20 h-10 rounded ${skeletonBg}`}></div>
            </div>
          </div>

          <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t border-borderColor dark:border-darkBorder px-4 py-3 flex items-center gap-2 absolute bottom-0 left-0 right-0">
            <div className={`h-5 w-5 rounded-full ${skeletonBg}`}></div>
            <div className={`h-4 w-8 rounded ${skeletonBg}`}></div>
            <div className={`h-4 w-16 rounded ${skeletonBg}`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default DashboardHeroSkeleton;