"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import ProfilePopoverContent from "../sidebar/ProfilePopoverContent";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

const ProfileDropDown = () => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const DropDownIcon = open ? ChevronUp : ChevronDown;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline2" className="py-[5px] dark:text-darkTextPrimary">
          <Image
            src={`https://avatar.iran.liara.run/public/18`}
            width={200}
            height={200}
            className=" w-7 sm:w-8 rounded-full"
            alt="User Avatar"
          />
          <span className="hidden md:block">Dannielis</span> Vettori
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
