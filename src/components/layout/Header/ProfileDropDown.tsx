"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import ProfilePopoverContent from "../sidebar/ProfilePopoverContent";
// import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useLogInUserStore } from "@/store/logInUserStore";

const ProfileDropDown = () => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const DropDownIcon = open ? ChevronUp : ChevronDown;
  const logInUserData = useLogInUserStore(state => state.logInUserData);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline2" className="h-10.5 dark:text-darkTextPrimary dark:hover:bg-darkSecondaryBg">
          <Avatar className="w-7.5 h-7.5">
            <AvatarImage src={logInUserData?.image ? logInUserData?.image : ""} alt="@shadcn" />
            <AvatarFallback>
              {logInUserData?.name
                ? logInUserData.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
                : ""}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-headingTextColor dark:text-darkTextPrimary">{logInUserData?.name}</span>
          <DropDownIcon size={20} />
        </Button>
      </PopoverTrigger>

      <ProfilePopoverContent
        side="bottom"
        align={isMobile ? "start" : "end"}
      />
    </Popover>
  );
};

export default ProfileDropDown;
