import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AllNotesModal = () => {
  const notes = [
    {
      id: 1,
      member: "Juyed Ahmed",
      date: "2025-08-23",
      project: "Orbit Technology's project",
      time: "Sat, Aug 23, 2025 8:15 am",
      content: "Design work is completed by him. Need more focus",
    },
    {
      id: 2,
      member: "Juyed Ahmed",
      date: "2025-08-23",
      project: "Orbit Technology's project",
      time: "Sat, Aug 23, 2025 8:15 am",
      content: "Design work is completed by him. Need more focus",
    },
  ];

  return (
    <DialogContent className="sm:max-w-[430px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-lg">
      <DialogHeader className="pb-2 border-b">
        <DialogTitle className="text-lg font-semibold">All notes</DialogTitle>
      </DialogHeader>

      <div className="mt-4 space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="border rounded-lg p-4 bg-[#f5f6f6] dark:bg-darkSecondaryBg hover:shadow-sm transition-all"
          >
            <p className="text-xs font-medium text-textGray mb-1 dark:text-darkTextPrimary">Member</p>
            <h3 className="text-sm font-semibold ">
              {note.member}&apos;s notes for {note.date}
            </h3>

            <p className="text-[13px] text-textGray mt-1 font-medium dark:text-darkTextPrimary">
              {note.project}
            </p>
            <p className="text-xs text-textGray dark:text-darkTextPrimary">{note.time}</p>

            <p className="text-sm text-textGray mt-2 dark:text-darkTextPrimary">{note.content}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-5 border-t pt-3">
      </div>
    </DialogContent>
  );
};

export default AllNotesModal;
