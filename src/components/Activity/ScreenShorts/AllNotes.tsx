import { getNotes } from "@/actions/screenshots/action";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ISearchParamsProps } from "@/types/type";
import { formatTZDayMonthHourMin } from "@/utils";
import { format } from "date-fns";
import { cookies } from "next/headers";
import EmptyTableLogo from "@/assets/empty_table.svg";
import Image from "next/image";

const AllNotesModal = async ({ searchParams }: ISearchParamsProps) => {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const params = await searchParams;
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const result = await getNotes({
    date: params.date ?? currentDate,
    user_id: params.user_id ?? userId,
  });
  
  return (
    <DialogContent className="sm:max-w-[430px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-lg">
      <DialogHeader className="pb-2 border-b dark:border-darkBorder">
        <DialogTitle className="text-lg font-medium">All notes</DialogTitle>
      </DialogHeader>

      <div className="mt-4 space-y-3">
        {result?.data?.map((note, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 bg-[#f5f6f6] dark:bg-darkSecondaryBg dark:border-darkBorder hover:shadow-sm transition-all"
          >
            {/* <p className="text-xs font-medium text-textGray mb-1 dark:text-darkTextPrimary">Member</p> */}
            <h3 className="text-sm font-medium ">
              {note?.user?.name}&apos;s notes
            </h3>

            <p className="text-[13px] text-textGray mt-1 font-medium dark:text-darkTextPrimary">
              {note.project?.name}
            </p>
            <p className="text-[13px] text-textGray mt-1 font-medium dark:text-darkTextPrimary">
              {note.task?.name}
            </p>
            <p className="text-xs text-textGray mt-1 border-b dark:border-darkBorder pb-1.5 dark:text-darkTextPrimary">{formatTZDayMonthHourMin(note?.start_time)} - {formatTZDayMonthHourMin(note?.end_time)}</p>

            <p className="text-sm text-textGray mt-2 dark:text-darkTextPrimary">{note?.notes}</p>
          </div>
        ))}
        {
          !result?.data?.length &&
          <div className="text-center">
            <div
              className={` flex flex-col gap-2.5 items-center justify-center  `}
            >
              <Image
                src={EmptyTableLogo}
                alt="table empty"
                width={120}
                height={120}
              />
              <p className=" sm:text-base">No Notes Available</p>
            </div>
          </div>
        }
      </div>

      <div className="flex justify-end mt-5 border-t dark:border-darkBorder pt-3">
      </div>
    </DialogContent>
  );
};

export default AllNotesModal;
