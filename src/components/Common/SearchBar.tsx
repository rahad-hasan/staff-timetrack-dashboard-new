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
      <div className="relative hidden sm:block sm:w-[280px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleChange}
          className="pl-9"
        />
      </div>
      <Button onClick={() => setIsOpen(!isOpen)} size={'sr'} className="bg-[#f6f7f9] block sm:hidden z-50" variant={'outline2'}>
        <Search
          className=" size-5 "
          size={20}
        />
      </Button>
      {
        isOpen && (
          <div className=" absolute top-0 right-10 z-50 bg-white shadow-2xl rounded-lg shadow-white ">
            <div className="relative min-w-[250px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={handleChange}
                className="pl-9 "
              />
            </div>
          </div>
        )
      }
    </div>
  );
}