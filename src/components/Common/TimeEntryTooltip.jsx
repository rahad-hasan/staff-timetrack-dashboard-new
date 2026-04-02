import { FolderOpen, Tag, Timer, Play, Square, Notebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function TimeEntryTooltip({ entry }) {
  const {
    project = "No Project",
    task = "No Task",
    duration = "00:00:00",
    startTime = "—",
    endTime = "—",
    isManual = false,
    notes = "",
    system_update,
  } = entry || {};

  return (
    <div className="w-64 rounded-xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
      {/* Header accent bar */}
      <div className="h-1 w-full bg-linear-to-r from-violet-500 via-indigo-500 to-blue-500 dark:from-violet-600 dark:via-indigo-600 dark:to-blue-600" />

      <div className="p-4 space-y-3">
        {/* Project */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-700 flex items-center justify-center">
            <FolderOpen className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide leading-none mb-0.5">
              Project
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
              {project}
            </p>
          </div>
        </div>

        {/* Task */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-700 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide leading-none mb-0.5">
              Task
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
              {task}
            </p>
          </div>
        </div>

        <Separator className="bg-slate-100 dark:bg-slate-700" />

        {/* Duration */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-700 flex items-center justify-center">
            <Timer className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide leading-none mb-0.5">
              Duration
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none font-mono">
              {duration}
            </p>
          </div>
        </div>

        {/* Start & End Time */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700/25 rounded-xl px-3 py-2">
            <Play className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-none mb-0.5">
                Start
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-none">
                {startTime}
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700/25 rounded-xl px-3 py-2">
            <Square className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-none mb-0.5">
                End
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-none">
                {endTime}
              </p>
            </div>
          </div>
        </div>

        {/* Manual Entry Badge */}
        {isManual && (
          <div>
            <Badge className="bg-amber-100 dark:bg-amber-200 text-amber-700 dark:text-amber-600 border border-amber-200 dark:border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-300 text-xs px-2.5 py-0.5 rounded-full font-medium gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-600 inline-block" />
              Manual Entry
            </Badge>
          </div>
        )}

        {/* Note */}
        {notes && (
          <>
            <Separator className="bg-slate-100 dark:bg-slate-700" />
            <div className="flex items-start gap-2">
              <Notebook className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                {notes}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TimeEntryTooltip;
