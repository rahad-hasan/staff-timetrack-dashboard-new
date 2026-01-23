"use client";
import { useEffect, useState } from 'react';
import SearchBar from '@/components/Common/SearchBar';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

const AttendanceHeroSearch = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) {
            params.set("search", debouncedSearch);
        } else {
            params.delete("search");
        }

        router.push(`?${params.toString()}`, { scroll: false });
    }, [debouncedSearch, router, searchParams]);

    return (
        <div>
            <SearchBar onSearch={setSearchTerm} />
        </div>
    );
};

export default AttendanceHeroSearch;