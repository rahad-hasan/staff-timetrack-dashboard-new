/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import SearchBar from "@/components/Common/SearchBar";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import CreateTaskModal from "@/components/ProjectManagement/Task/CreateTaskModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLogInUserStore } from "@/store/logInUserStore";
import { getMembersDashboard } from "@/actions/members/action";

const TaskHeroSection = () => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any>([]);
  // type Tab = "List view" | "Kanban";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", query);
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const getMembers = async () => {
      const res = await getMembersDashboard();

      const users = res.data.map((u) => ({
        id: String(u.id),
        label: u.name,
        avatar: u.image || "",
      }));

      setUsers(users);
    };

    getMembers();
  }, []);

  // const activeTab = (searchParams.get("tab") as Tab) ?? "List view";

  // const setTab = (tab: Tab) => {
  //     const params = new URLSearchParams(searchParams.toString());
  //     params.set("tab", tab);
  //     params.set("page", "1"); // reset pagination if needed
  //     router.push(`?${params.toString()}`);
  // };

  useEffect(() => {
    // If there are any search params at all, clear them on mount
    if (searchParams.toString()) {
      router.replace(pathname, { scroll: false });
    }
  }, []);

  const handleCloseDialog = () => {
    setOpen(false);
  };
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <HeadingComponent
          heading="Tasks"
          subHeading="All the tasks during the working hour by team member is here"
        ></HeadingComponent>

        <div className=" flex items-center gap-3 sm:gap-5">
          {/* <div className="flex gap-3"> */}
          {/* <div className="inline-flex mt-3 sm:mt-0 h-10 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg">
                            {["List view", "Kanban"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setTab(tab as "List view" | "Kanban")}
                                    className={`px-3 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg ${activeTab === tab
                                        ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                        : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                        } flex-shrink-0`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div> */}
          {/* </div> */}
          {(logInUserData?.role === "admin" ||
            logInUserData?.role === "manager" ||
            logInUserData?.role === "hr") && (
            <Dialog open={open} onOpenChange={setOpen}>
              {/* <Button onClick={() => setOpen(true)} className=""><Plus className="size-5" /> <span className=" hidden sm:block">Create Task</span></Button> */}
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-5" />
                  <span className="hidden sm:block">Create Task</span>
                </Button>
              </DialogTrigger>
              <CreateTaskModal
                handleCloseDialog={handleCloseDialog}
              ></CreateTaskModal>
            </Dialog>
          )}
        </div>
      </div>
      <div className=" flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
        <div className=" flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <SelectProjectDropDown></SelectProjectDropDown>
          <div className=" flex items-center gap-3 w-full">
            <div className=" w-full">
              <SelectUserDropDown users={users} defaultSelect={false} />
            </div>
            <div className=" block sm:hidden">
              <SearchBar onSearch={handleSearch}></SearchBar>
            </div>
          </div>
        </div>
        <div className=" hidden sm:block">
          <SearchBar onSearch={handleSearch}></SearchBar>
        </div>
      </div>
    </div>
  );
};

export default TaskHeroSection;
