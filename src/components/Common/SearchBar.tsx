"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "../ui/button";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value.trim());
  };

  return (
    <div className="relative">
      <div className="relative hidden sm:block h-10 sm:w-[280px] dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg rounded-lg">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-darkTextPrimary "
          size={18}
        />
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleChange}
          className="pl-9  h-10 dark:border-darkBorder dark:text-darkTextPrimary rounded-lg"
        />
      </div>
      {/* responsive */}
      <Button onClick={() => setIsOpen(!isOpen)} className="bg-bgSecondary dark:bg-darkPrimaryBg block sm:hidden z-50 py-[8px]" variant={'outline2'}>
        <Search
          className=" size-5 text-headingTextColor dark:text-darkTextPrimary"
          size={20}
        />
      </Button>
      {
        isOpen && (
          <div className=" absolute top-0 right-10 z-50 bg-bgSecondary dark:bg-darkPrimaryBg shadow-2xl rounded-lg shadow-white dark:border-darkBorder ">
            <div className="relative min-w-[250px] dark:border-darkBorder ">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-darkTextSecondary"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={handleChange}
                className="pl-9 py-4.5 dark:border-darkBorder dark:text-darkTextPrimary"
              />
            </div>
          </div>
        )
      }
    </div>
  );
}