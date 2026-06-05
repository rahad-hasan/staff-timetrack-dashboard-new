/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import ClockIcon from "@/components/Icons/ClockIcon";
import CalendarIcon from "@/components/Icons/CalendarIcon";
import JobIcon from "@/components/Icons/JobIcon";
import TaskListIcon from "@/components/Icons/TaskListIcon";
import UserIcon from "@/components/Icons/UserIcon";
import { addManualTimeEntry, addTimeEntry } from "@/actions/timesheets/action";
import { getMembersDashboard } from "@/actions/members/action";
import { getProjects } from "@/actions/projects/action";
import { getTasks } from "@/actions/task/action";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { IProject, ITask } from "@/types/type";
import { addManualTimeSchema } from "@/zod/schema";
import { toast } from "sonner";

interface TimePeriod {
  start: number;
  end: number;
}

interface MemberOption {
  id: number;
  name: string;
  image?: string | null;
}

const createAddManualTimeFormSchema = (isAdmin: boolean) =>
  addManualTimeSchema
    .extend({
      userId: z.number().optional(),
    })
    .superRefine((value, ctx) => {
      if (isAdmin && !value.userId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "User is required",
          path: ["userId"],
        });
      }
    });

type AddManualTimeFormValues = z.infer<
  ReturnType<typeof createAddManualTimeFormSchema>
>;

const buildIsoDateTime = (date: Date, time: string) => {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const value = new Date(date);

  value.setHours(hours, minutes, seconds || 0, 0);

  return value.toISOString();
};

const errorToastStyle = {
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
} as const;

const AddManualTimeModal = ({
  isAdmin,
  onClose,
}: {
  isAdmin: boolean;
  onClose: () => void;
}) => {
  const formSchema = useMemo(
    () => createAddManualTimeFormSchema(isAdmin),
    [isAdmin],
  );

  const form = useForm<AddManualTimeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: undefined,
      project: undefined,
      task: undefined,
      date: null,
      timeFrom: "07:30:00",
      timeTo: "08:30:00",
      message: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [taskSearch, setTaskSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [activePeriods, setActivePeriods] = useState<TimePeriod[] | undefined>(
    undefined,
  );
  const [totalTime, setTotalTime] = useState<string>("1:00:00");

  const debouncedProjectSearch = useDebounce(projectSearch, 500);
  const debouncedTaskSearch = useDebounce(taskSearch, 500);
  const selectedProject = form.watch("project");
  const selectedUserId = form.watch("userId");
  const timeFrom = form.watch("timeFrom");
  const timeTo = form.watch("timeTo");

  const filteredMembers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return members;
    }

    return members.filter((member) =>
      member.name.toLowerCase().includes(normalizedSearch),
    );
  }, [members, userSearch]);

  const timeToDecimal = (time: string): number => {
    const [hours = "0", minutes = "0"] = time.split(":");
    return Number(hours) + Number(minutes) / 60;
  };

  const showErrorToast = (message: string) => {
    toast.error(message, {
      style: errorToastStyle,
    });
  };

  useEffect(() => {
    const loadProjects = async () => {
      setProjectLoading(true);

      try {
        const res = await getProjects({ search: debouncedProjectSearch });
        setProjects(res?.success ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch projects", err);
        setProjects([]);
      } finally {
        setProjectLoading(false);
      }
    };

    loadProjects();
  }, [debouncedProjectSearch]);

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      setTaskLoading(true);

      try {
        const res = await getTasks({
          project_id: selectedProject,
          search: debouncedTaskSearch,
        });

        setTasks(res?.success ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
        setTasks([]);
      } finally {
        setTaskLoading(false);
      }
    };

    loadTasks();
  }, [debouncedTaskSearch, selectedProject]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const loadMembers = async () => {
      setMemberLoading(true);

      try {
        const res = await getMembersDashboard(
          selectedProject ? { project_id: selectedProject } : {},
        );

        setMembers(
          res?.success
            ? res.data.map((member) => ({
                id: member.id,
                name: member.name,
                image: member.image,
              }))
            : [],
        );
      } catch (err) {
        console.error("Failed to fetch members", err);
        setMembers([]);
      } finally {
        setMemberLoading(false);
      }
    };

    loadMembers();
  }, [isAdmin, selectedProject]);

  useEffect(() => {
    form.setValue("task", undefined);
    setTaskSearch("");
  }, [form, selectedProject]);

  useEffect(() => {
    if (!isAdmin || !selectedUserId) {
      return;
    }

    if (!members.some((member) => member.id === selectedUserId)) {
      form.setValue("userId", undefined, { shouldValidate: true });
    }
  }, [form, isAdmin, members, selectedUserId]);

  useEffect(() => {
    if (timeFrom && timeTo) {
      const startTimeDecimal = timeToDecimal(timeFrom);
      const endTimeDecimal = timeToDecimal(timeTo);

      if (endTimeDecimal > startTimeDecimal) {
        setActivePeriods([{ start: startTimeDecimal, end: endTimeDecimal }]);

        const durationInHours = endTimeDecimal - startTimeDecimal;
        const hours = Math.floor(durationInHours);
        const minutes = Math.round((durationInHours - hours) * 60);

        setTotalTime(
          `${hours.toString()}:${minutes.toString().padStart(2, "0")}:00`,
        );
      } else {
        setActivePeriods(undefined);
        setTotalTime("0:00:00");
      }
    } else {
      setActivePeriods(undefined);
      setTotalTime("0:00:00");
    }
  }, [timeFrom, timeTo]);

  const onSubmit = async (data: AddManualTimeFormValues) => {
    if (!data.date) {
      return;
    }

    if (isAdmin && !data.userId) {
      form.setError("userId", {
        type: "manual",
        message: "User is required",
      });
      return;
    }

    const payload = {
      project_id: data.project,
      ...(data.task && { task_id: data.task }),
      start_time: buildIsoDateTime(data.date, data.timeFrom),
      end_time: buildIsoDateTime(data.date, data.timeTo),
      note: data.message,
    };

    setLoading(true);

    try {
      const res = isAdmin
        ? await addTimeEntry({
            ...payload,
            user_id: data.userId as number,
          })
        : await addManualTimeEntry(payload);

      if (res?.success) {
        form.reset();
        setDate(undefined);
        setProjectSearch("");
        setTaskSearch("");
        setUserSearch("");
        toast.success(
          res?.message ||
            (isAdmin
              ? "Time added successfully"
              : "Manual time added successfully"),
        );

        setTimeout(() => {
          onClose();
        }, 0);
      } else {
        showErrorToast(
          res?.message ||
            (isAdmin ? "Failed to add time" : "Failed to add manual time"),
        );
      }
    } catch (error: any) {
      console.error("failed:", error);
      showErrorToast(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent
      onInteractOutside={(event) => event.preventDefault()}
      className=" w-full sm:max-w-131.25 max-h-[95vh] overflow-y-auto"
    >
      <DialogHeader>
        <DialogTitle>Add Time</DialogTitle>
        <DialogDescription asChild className="">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 mt-4 mb-4">
                <FormField
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel required={true}>Project</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <div className="flex gap-2 items-center">
                                <JobIcon
                                  size={20}
                                  className="text-headingTextColor dark:text-darkTextPrimary"
                                />
                                <SelectValue placeholder="Select Project" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <Input
                                type="text"
                                placeholder="Search project..."
                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                value={projectSearch}
                                onChange={(event) =>
                                  setProjectSearch(event.target.value)
                                }
                                onKeyDown={(event) => event.stopPropagation()}
                              />
                              {projectLoading ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  Loading...
                                </div>
                              ) : projects.length > 0 ? (
                                projects.map((project) => (
                                  <SelectItem
                                    key={project.id}
                                    value={project.id.toString()}
                                  >
                                    {project.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-center text-muted-foreground">
                                  No projects found
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="task"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel
                        className={!selectedProject ? "opacity-50" : ""}
                      >
                        Task
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            disabled={!selectedProject}
                          >
                            <SelectTrigger className="w-full">
                              <div className="flex gap-2 items-center">
                                <TaskListIcon
                                  size={20}
                                  className="text-headingTextColor dark:text-darkTextPrimary"
                                />
                                <SelectValue
                                  placeholder={
                                    selectedProject
                                      ? "Select Task"
                                      : "Select Project First"
                                  }
                                />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <Input
                                type="text"
                                placeholder="Search task..."
                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                value={taskSearch}
                                onChange={(event) =>
                                  setTaskSearch(event.target.value)
                                }
                                onKeyDown={(event) => event.stopPropagation()}
                              />
                              {!selectedProject ? (
                                <div className="p-2 text-sm text-center text-muted-foreground">
                                  Select a project to load tasks
                                </div>
                              ) : taskLoading ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  Loading...
                                </div>
                              ) : tasks.length > 0 ? (
                                tasks.map((task) => (
                                  <SelectItem
                                    key={task.id}
                                    value={task.id.toString()}
                                  >
                                    {task.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-center text-muted-foreground">
                                  No tasks found
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin ? (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel required={true}>User</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Select
                              value={field.value?.toString()}
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <div className="flex gap-2 items-center">
                                  <span className="text-headingTextColor dark:text-darkTextPrimary">
                                    <UserIcon size={18} />
                                  </span>
                                  <SelectValue placeholder="Select User" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <Input
                                  type="text"
                                  placeholder="Search user..."
                                  className="flex-1 border-none focus:ring-0 focus:outline-none"
                                  value={userSearch}
                                  onChange={(event) =>
                                    setUserSearch(event.target.value)
                                  }
                                  onKeyDown={(event) => event.stopPropagation()}
                                />
                                {memberLoading ? (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    Loading...
                                  </div>
                                ) : filteredMembers.length > 0 ? (
                                  filteredMembers.map((member) => (
                                    <SelectItem
                                      key={member.id}
                                      value={member.id.toString()}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage
                                            src={member.image || ""}
                                            alt={member.name}
                                          />
                                          <AvatarFallback className="text-[10px]">
                                            {member.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{member.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-sm text-center text-muted-foreground">
                                    No users found
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className=" w-full ">
                      <FormLabel required={true}>Date</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline2"
                            id="date"
                            className="w-full justify-between font-normal px-3 flex items-center dark:hover:bg-darkPrimaryBg dark:bg-darkPrimaryBg"
                          >
                            <div className=" flex items-center gap-2 dark:text-darkTextPrimary ">
                              <CalendarIcon
                                size={20}
                                className=" text-headingTextColor dark:text-darkTextPrimary"
                              />
                              {date ? date.toLocaleDateString() : "Select date"}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            onSelect={(selectedDate) => {
                              setDate(selectedDate);
                              setOpen(false);
                              field.onChange(selectedDate);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormLabel required={true} className="-mb-1 ">
                  Time
                </FormLabel>
                <div className=" flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <FormField
                    control={form.control}
                    name="timeFrom"
                    render={({ field }) => (
                      <FormItem className=" w-full">
                        <FormControl className="">
                          <div className="relative ">
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
                              <ClockIcon
                                size={16}
                                className=" text-headingTextColor dark:text-darkTextPrimary"
                              />
                              <span className="sr-only">Time From</span>
                            </div>
                            <Input
                              type="time"
                              id="time-picker"
                              step="1"
                              {...field}
                              className="peer bg-background dark:bg-darkPrimaryBg dark:border-darkBorder appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <span className="px-2">TO</span>

                  <FormField
                    control={form.control}
                    name="timeTo"
                    render={({ field }) => (
                      <FormItem className=" w-full">
                        <FormControl>
                          <div className="relative">
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
                              <ClockIcon
                                size={16}
                                className=" text-headingTextColor dark:text-darkTextPrimary"
                              />
                              <span className="sr-only">Time To</span>
                            </div>
                            <Input
                              type="time"
                              id="time-picker2"
                              step="1"
                              {...field}
                              className="peer bg-background dark:bg-darkPrimaryBg dark:border-darkBorder appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormLabel className="-mb-1 mt-2">
                  Total Time: {totalTime}
                </FormLabel>
                <div className="relative h-5 bg-bgSecondary dark:bg-darkPrimaryBg rounded-4xl border border-borderColor dark:border-darkBorder">
                  {activePeriods?.map((period, index) => {
                    const startPercent = (period.start / 24) * 100;
                    const endPercent = (period.end / 24) * 100;
                    const width = endPercent - startPercent;

                    if (width > 0) {
                      return (
                        <div
                          key={index}
                          className="absolute h-5 bg-primary rounded-4xl"
                          style={{
                            left: `${startPercent}%`,
                            width: `${width}%`,
                          }}
                        ></div>
                      );
                    }

                    return null;
                  })}
                </div>
                <div className=" flex justify-between -mt-2">
                  <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">
                    1h
                  </span>
                  <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">
                    6h
                  </span>
                  <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">
                    12h
                  </span>
                  <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">
                    18h
                  </span>
                  <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">
                    24h
                  </span>
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className=" w-full ">
                      <FormLabel required>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          className="dark:border-darkBorder"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  );
};

export default AddManualTimeModal;
