"use client";

export default function MembersError({
  error,
}: {
  error: Error;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-xl font-semibold mb-2">
        {"Something Went Wrong"}
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        {error.message
          ?
          error.message
          :
          "Please check your internet connection."
        }
      </p>

    </div>
  );
}
