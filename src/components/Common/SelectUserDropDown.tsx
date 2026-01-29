/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  // CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect, useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import DownArrow from "../Icons/DownArrow";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// import { getMembersDashboard } from "@/actions/members/action";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useTopLoader } from "nextjs-toploader";

interface ISelectUserDropDown {
  defaultSelect?: boolean;
  users: { id: string; label: string; avatar: string }[];
}

const SelectUserDropDown = ({
  defaultSelect = true,
  users,
}: ISelectUserDropDown) => {
  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("user_id");
  const loader = useTopLoader();
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // // 2. Fetch Members
  // useEffect(() => {
  //   const fetchMembers = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await getMembersDashboard();
  //       if (res?.success) {
  //         const formatted = res?.data?.map((u: any) => ({
  //           id: String(u?.id),
  //           label: u?.name,
  //           avatar: u?.image || u?.avatar || "",
  //         }));
  //         setUsers(formatted);
  //       }
  //     } catch (err) {
  //       console.error("Fetch members error:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchMembers();
  // }, []);

  // 3. Logic to handle Default Selection on Mount or Store Update
  useEffect(() => {
    if (!defaultSelect) return;
    if (searchParams.get("user_id")) return;
    if (!logInUserData?.id) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("user_id", String(logInUserData.id));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [defaultSelect, logInUserData?.id]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value),
    [users, value],
  );

  const handleSelect = (currentId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (currentId === value) {
      params.delete("user_id");
    } else {
      params.set("user_id", currentId);
    }
    loader.start()
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline2"
          role="combobox"
          aria-expanded={open}
          disabled={logInUserData?.role === "employee"}
          className="w-full sm:w-[250px] h-10 bg-[#f6f7f9] flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedUser && (
              <Avatar className="w-6 h-6">
                <AvatarImage
                  src={selectedUser.avatar ?? ""}
                  alt={selectedUser.label}
                  className=" bg-darkTextPrimary"
                />

                <AvatarFallback className="">
                  {selectedUser.label?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="truncate max-w-[150px]">
              {selectedUser ? selectedUser.label : "Select User..."}
            </span>
          </div>
          <DownArrow size={16} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg">
        <Command className="dark:bg-darkSecondaryBg">
          <CommandInput
            placeholder="Search User..."
            className="h-9"
            value={searchInput}
            onValueChange={setSearchInput}
          />
          <CommandList>
            <CommandGroup>
              {users.map((user: any) => (
                <CommandItem
                  key={user.id}
                  value={user.label}
                  onSelect={() => handleSelect(user.id)}
                  className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                >
                  <Avatar className="w-6 h-6 mr-2 shrink-0">
                    <AvatarImage src={user?.avatar} alt={user?.label} />
                    <AvatarFallback>{user?.label.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user?.label}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      value === user.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(SelectUserDropDown);
