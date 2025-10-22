const KanbanDndListSkeleton = () => {
  return (
    <div className=" grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-5">
      <div className="flex-1 bg-white border-2 border-borderColor rounded-lg p-4">
        <div className="flex justify-between mb-4">
          <div className="w-20 h-6 bg-gray-300 animate-pulse rounded"></div>
        </div>
        <div className="space-y-5">
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
        </div>
      </div>

      <div className="flex-1 bg-white border-2 border-borderColor rounded-lg p-4">
        <div className="flex justify-between mb-4">
          <div className="w-20 h-6 bg-gray-300 animate-pulse rounded"></div>
        </div>
        <div className="space-y-5">
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
          {/* <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div> */}
        </div>
      </div>

      <div className="flex-1 bg-white border-2 border-borderColor rounded-lg p-4">
        <div className="flex justify-between mb-4">
          <div className="w-20 h-6 bg-gray-300 animate-pulse rounded"></div>
        </div>
        <div className="space-y-5">
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
          {/* <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div>
          <div className="bg-gray-200 w-full h-46 animate-pulse rounded-md"></div> */}
        </div>
      </div>
    </div>
  );
};

export default KanbanDndListSkeleton;
