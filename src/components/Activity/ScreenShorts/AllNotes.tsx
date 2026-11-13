import { getNotes } from "@/actions/screenshots/action";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ISearchParamsProps } from "@/types/type";
import { formatTZDayMonthHourMin } from "@/utils";
import EmptyTableLogo from "@/assets/empty_table.svg";
import Image from "next/image";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import { requireDataOrRefusal } from "@/lib/server/liveData";

/**
 * The Notes dialog. Its read sits in a boundary inside the dialog, which only
 * renders its content while open: a failed read shows and heals there instead
 * of taking the screenshots page down with it.
 */
const AllNotesModal = ({ searchParams }: ISearchParamsProps) => (
  <DialogContent className="sm:max-w-[430px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-lg">
    <DialogHeader className="pb-2 border-b dark:border-darkBorder">
      <DialogTitle className="text-lg font-medium">All notes</DialogTitle>
    </DialogHeader>

    <LiveDataBoundary compact>
      <NotesList searchParams={searchParams} />
    </LiveDataBoundary>

    <div className="flex justify-end mt-5 border-t dark:border-darkBorder pt-3">
    </div>
  </DialogContent>
);

const NotesList = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const { userId, zone, date } = await resolveViewFilters(params);

  const result = await getNotes({
    date,
    user_id: userId,
    // The same day as the screenshots beside it: the backend reads `date` in
    // this zone, falling back to the user's own like the other views.
    timezone: params?.timezone,
    // And the same project: with the grid filtered to one project, the notes
    // listed every project's. The page's Suspense key includes the param, so
    // a project change re-reads them.
    project_id: params?.project_id,
  });
  // A refusal (no access to the member, no such member) shows no notes; any
  // other failure throws rather than passing for "No Notes Available".
  requireDataOrRefusal(result, "the activity notes");

  return (
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
          {/* An explicit zone: the helpers' default reads the client user
              store, which on the server is an empty process-wide singleton
              (date-fns-tz then formats in UTC). */}
          <p className="text-xs text-textGray mt-1 border-b dark:border-darkBorder pb-1.5 dark:text-darkTextPrimary">{formatTZDayMonthHourMin(note?.start_time, zone)} - {formatTZDayMonthHourMin(note?.end_time, zone)}</p>

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
  );
};

/**
 * What the Notes dialog shows if it is opened before the notes have streamed
 * in. The list loads behind its own <Suspense>, so it never holds up the
 * screenshots page — but a closed dialog must still open to something.
 */
export const AllNotesFallback = () => (
  <DialogContent
    aria-describedby={undefined}
    className="sm:max-w-[430px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-lg"
  >
    <DialogHeader className="pb-2 border-b dark:border-darkBorder">
      <DialogTitle className="text-lg font-medium">All notes</DialogTitle>
    </DialogHeader>
    <p className="py-10 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
      Loading notes…
    </p>
  </DialogContent>
);

export default AllNotesModal;
