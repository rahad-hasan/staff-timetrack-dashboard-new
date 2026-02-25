/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
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
import React, { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import DownArrow from "../Icons/DownArrow";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// import { getMembersDashboard } from "@/actions/members/action";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useTopLoader } from "nextjs-toploader";

interface ISelectUserDropDown {
  defaultSelect?: boolean;
  users: { id: string; label: string; avatar: string }[];
  loading?: boolean
}

const SelectUserDropDown = ({
  defaultSelect = true,
  users,
  loading,
}: ISelectUserDropDown) => {
  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // const value = searchParams.get("user_id");
  const loader = useTopLoader();
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const urlUserId = searchParams.get("user_id");
  const defaultUserId = defaultSelect ? String(logInUserData?.id ?? "") : "";
  const [valueUser, setValueUser] = useState<string>(urlUserId ?? defaultUserId);

  useEffect(() => {
    setValueUser(urlUserId ?? defaultUserId);
  }, [urlUserId, defaultUserId]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === valueUser),
    [users, valueUser],
  );

  const handleSelect = (currentId: string) => {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());

    if (currentId === valueUser) {
      params.delete("user_id");
    } else {
      params.set("user_id", currentId);
      setValueUser(currentId)
    }
    loader.start()
    setSearchInput("")
    requestAnimationFrame(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    })
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSearchInput("");
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline2"
          role="combobox"
          aria-expanded={open}
          // disabled={logInUserData?.role === "employee"}
          className="w-full sm:w-[250px] h-10 bg-[#f6f7f9] flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedUser && (
              <Avatar className="w-6 h-6">
                <AvatarImage
                  width={50}
                  height={50}
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

      <PopoverContent className="sm:w-[250px] p-0 dark:bg-darkSecondaryBg dark:border-darkBorder">
        <Command className="dark:bg-darkSecondaryBg">
          <CommandInput
            placeholder="Search User..."
            className="h-9"
            value={searchInput}
            onValueChange={setSearchInput}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No user found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user: any) => (
                <CommandItem
                  key={user.id}
                  value={user.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
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
                      valueUser === user.id ? "opacity-100" : "opacity-0",
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
